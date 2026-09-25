// Final pass of the translation: re-point the #anchors of translated pages at
// the headings their target pages have NOW.
//
// Anchors used to be resolved while each file was written, against target pages
// read (and cached) from disk before this run rewrote them: a link to a page
// retranslated in the same run kept the main-language anchor or a stale one.
// And a paragraph left untouched (its main paragraph unchanged) was never
// revisited when the heading it links to got retranslated. Both ended as
// "invalid hash" at build. This pass runs once every file is written, over all
// translated pages, and only rewrites anchors that match no target heading.

import { mapAnchor } from './anchors.mjs';

// Link targets carrying a #hash: Markdown `](target)` and JSX `href="target"`.
// Group 1 = syntax before the target, group 2 = the target.
const LINK_RE = /(\]\(|href=["'])(#[^)\s"']+|\/[a-z]{2}\/[^)\s"'#]*#[^)\s"']+)(?=[)"'])/g;
const P_TAG_SPLIT_RE = /^(\{\/\*\s*t:p\s+\S+\s*\*\/\})$/m;
const P_HASH_RE = /t:p\s+(\S+)/;

// "/en/doc/#a" → { lang: 'en', path: 'doc', key: 'doc', base: '/en/doc/', anchor: 'a' };
// "#a" (same page) → { lang: null, path: null, key: '', base: '', anchor: 'a' }.
export function parseLink(target) {
  const i = target.indexOf('#');
  const base = target.slice(0, i);
  const anchor = target.slice(i + 1);
  const m = base.match(/^\/([a-z]{2})\/(.*)$/);
  if (!m) return { lang: null, path: null, key: '', base, anchor };
  const path = m[2].replace(/\/$/, '');
  return { lang: m[1], path, key: path, base, anchor };
}

const linksOf = (text) => [...text.matchAll(LINK_RE)].map((m) => parseLink(m[2]));

// Re-point the broken anchors of one translated paragraph. `mainText` = its main
// paragraph (same t:p hash); `headings(lang, path)` = headings of the page served
// at /<lang>/<path>/ (path null = the page being processed, in that language).
// A broken anchor is fixed from, in order: itself (still the main-language
// anchor, fresh from the agent), then the main paragraph's link at the same rank
// towards the same page. Cross-language links and unsure cases are left as is.
export function relinkParagraph(text, mainText, { tgt, mainLang, headings }) {
  const mainLinks = linksOf(mainText);
  const total = new Map();
  for (const l of linksOf(text)) total.set(l.key, (total.get(l.key) || 0) + 1);
  const rank = new Map();

  return text.replace(LINK_RE, (full, pre, target) => {
    const link = parseLink(target);
    const r = rank.get(link.key) || 0;
    rank.set(link.key, r + 1);
    if (link.lang && link.lang !== tgt) return full; // intentional cross-language link
    const tgtHeadings = headings(tgt, link.path);
    if (tgtHeadings.some((h) => h.slug === link.anchor)) return full;
    const mainHeadings = headings(mainLang, link.path);

    const same = mainLinks.filter((m) => m.key === link.key);
    const counterpart = same.length === total.get(link.key) ? same[r] : same.length === 1 ? same[0] : null;
    const candidates = [mapAnchor(mainHeadings, tgtHeadings, link.anchor)];
    if (counterpart) {
      candidates.push(counterpart.lang === tgt
        ? (tgtHeadings.some((h) => h.slug === counterpart.anchor) ? counterpart.anchor : null)
        : mapAnchor(mainHeadings, tgtHeadings, counterpart.anchor));
    }
    const fixed = candidates.find(Boolean);
    return fixed ? `${pre}${link.base}#${fixed}` : full;
  });
}

// Apply relinkParagraph to every tagged paragraph of a translated file, on the
// raw text (bytes outside rewritten anchors are kept exactly).
export function relinkFile(text, mainText, ctx) {
  const mainParts = mainText.split(P_TAG_SPLIT_RE);
  const mainByHash = new Map();
  for (let i = 1; i < mainParts.length; i += 2) mainByHash.set(P_HASH_RE.exec(mainParts[i])[1], mainParts[i + 1]);
  const parts = text.split(P_TAG_SPLIT_RE);
  for (let i = 1; i < parts.length; i += 2) {
    const main = mainByHash.get(P_HASH_RE.exec(parts[i])[1]);
    if (main) parts[i + 1] = relinkParagraph(parts[i + 1], main, ctx);
  }
  return parts.join('');
}
