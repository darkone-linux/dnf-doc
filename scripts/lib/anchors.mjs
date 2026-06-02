// Deterministic heading-anchor resolution for internal links.
//
// Astro/Starlight derives each heading's `id` (the `#anchor` target) with
// `github-slugger` over the heading's rendered text. We reuse the very same lib
// so we can compute the EXACT anchor of any heading without guessing — and pair
// headings positionally between a source file and its translation to rewrite
// `#anchor`s the way translate.mjs already rewrites the `/lang/` link prefix.

import GithubSlugger from 'github-slugger';

const HEADING_RE = /^(#{1,6})\s+(.*)$/;

// Decode the numeric (and a few named) HTML entities Astro decodes before
// slugging. The codegen emits emojis as `&#x1F4E6;`, so `### &#x1F4E6; foo`
// must slug like the rendered "📦 foo" → `-foo`.
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

// Reduce inline Markdown to the plain text Astro slugs (links/images → their
// text, inline code → its content, emphasis markers removed, escapes resolved).
function stripInlineMarkdown(s) {
  return s
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url) / ![alt](url) → text/alt
    .replace(/`([^`]*)`/g, '$1')               // `code` → code
    .replace(/[*_~]+/g, '')                     // emphasis / strikethrough markers
    .replace(/\\([\\`*_{}[\]()#+\-.!~])/g, '$1'); // unescape \x
}

// Plain heading text used for slugging (accepts a raw heading line or bare text).
export function headingText(line) {
  const m = HEADING_RE.exec(line.trim());
  const raw = m ? m[2] : line.trim();
  return decodeEntities(stripInlineMarkdown(raw)).trim();
}

// Fenced code blocks must be skipped (a `#` line inside ```nix is a comment, not
// a heading). CommonMark rule: a fence with an info string can only OPEN; a
// closing fence is bare. This matters because the generated module reference
// embeds nix code whose `# comment` lines would otherwise be taken as headings.
const FENCE_RE = /^(\s*)(```+|~~~+)(.*)$/;

// Ordered [{ text, slug }] for every ATX heading in a Markdown/MDX body, using a
// single github-slugger so duplicates get `-1`, `-2`… exactly like Astro.
export function slugsFromMarkdown(body) {
  const slugger = new GithubSlugger();
  const out = [];
  let inFence = false;
  for (const line of body.split('\n')) {
    const f = FENCE_RE.exec(line);
    if (f) {
      if (!inFence) inFence = true;
      else if (f[3].trim() === '') inFence = false; // bare fence closes
      continue;
    }
    if (inFence || !HEADING_RE.test(line.trim())) continue;
    const text = headingText(line);
    if (text) out.push({ text, slug: slugger.slug(text) });
  }
  return out;
}

// Ordered [{ text, slug }] for a parsed doc (lib/mdx-doc.mjs). The body is
// reconstructed from its paragraph blocks so heading extraction stays correct
// even where the doc parser merged blocks (it never drops heading lines).
export function headingSlugs(doc) {
  return slugsFromMarkdown(doc.paragraphs.map((p) => p.content).join('\n\n'));
}

// Set of valid anchors for a parsed doc (for the link validator).
export function anchorSet(doc) {
  return new Set(headingSlugs(doc).map((h) => h.slug));
}

// Map a source-language anchor to the target-language one by heading position.
// Returns the target slug, or null when the anchor is unknown in the source or
// the target has no heading at that index (caller leaves the link untouched and
// lets the validator flag it).
export function mapAnchor(srcSlugs, tgtSlugs, anchor) {
  const i = srcSlugs.findIndex((h) => h.slug === anchor);
  if (i === -1) return null;
  return tgtSlugs[i] ? tgtSlugs[i].slug : null;
}
