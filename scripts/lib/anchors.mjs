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
// single github-slugger so duplicates get `-1`, `-2`… exactly like Astro (pass
// the document's slugger when scanning it block by block).
export function slugsFromMarkdown(body, slugger = new GithubSlugger()) {
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

// Ordered [{ text, slug, key }] for a parsed doc (lib/mdx-doc.mjs), scanned
// block by block with one slugger (the parser never drops heading lines). `key`
// = t:p hash of the paragraph holding the heading + its rank in it: the hash is
// shared by a main file and its translations, so headings pair up exactly
// across languages. Null for an untagged paragraph.
export function headingSlugs(doc) {
  const slugger = new GithubSlugger();
  return doc.paragraphs.flatMap((p) => slugsFromMarkdown(p.content, slugger)
    .map((h, k) => ({ ...h, key: p.hash ? `${p.hash}:${k}` : null })));
}

// Set of valid anchors for a parsed doc (for the link validator).
export function anchorSet(doc) {
  return new Set(headingSlugs(doc).map((h) => h.slug));
}

// Map a source-language anchor to the target-language one: the target heading
// of the same paragraph (shared t:p key), whatever the headings order or a
// missing translated paragraph. Untagged/unpaired heading → by position, only
// when both sides have as many headings. Null when unknown in the source or
// without a sure counterpart (caller leaves the link to the validator).
export function mapAnchor(srcSlugs, tgtSlugs, anchor) {
  const i = srcSlugs.findIndex((h) => h.slug === anchor);
  if (i === -1) return null;
  const { key } = srcSlugs[i];
  const paired = key && tgtSlugs.find((h) => h.key === key);
  if (paired) return paired.slug;
  return srcSlugs.length === tgtSlugs.length ? tgtSlugs[i].slug : null;
}
