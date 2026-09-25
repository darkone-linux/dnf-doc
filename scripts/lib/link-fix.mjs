// Repair material for links the build validator flags as "invalid hash".
//
// starlight-links-validator (JSON reporter) gives, per broken link, the source
// page and the raw link. From there we compute what an agent needs to pick the
// right anchor WITHOUT guessing slugs: the target page's real anchors (same
// github-slugger as Astro) and, for a translated page, the anchor its
// main-language paragraph points to, mapped by heading position.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseDoc } from './mdx-doc.mjs';
import { headingSlugs } from './anchors.mjs';

const P_TAG_RE = /^\s*\{\/\*\s*t:p\s+(\S+)\s*\*\/\}\s*$/;
const ANY_TAG_RE = /^\s*\{\/\*\s*t:[a-z-]+.*\*\/\}\s*$/;
// Link targets carrying a #hash: Markdown `](target)` and JSX `href="target"`.
const HASH_LINK_RE = /\]\(([^)\s]*#[^)\s]+)\)|href=["']([^"']*#[^"']+)["']/g;
const ANSI_RE = /\x1b\[[0-9;]*m/g;

// "/en/doc/#file-layout" → { pathPart: "/en/doc/", anchor: "file-layout" }.
export function splitLink(link) {
  const i = link.indexOf('#');
  return { pathPart: link.slice(0, i), anchor: link.slice(i + 1) };
}

// Page (path relative to docsDir) a link path is served from, mirroring
// Starlight: `/<lang>/p/` → <lang>/p.mdx or <lang>/p/index.mdx; a page missing
// in <lang> falls back to the default locale, whose content Starlight serves.
export function resolvePage(docsDir, pathPart, fallbackLang) {
  const m = pathPart.split('?')[0].match(/^\/([a-z]{2})(?:\/(.*))?$/);
  if (!m) return null;
  const [, lang, rest = ''] = m;
  const logical = rest.replace(/\/$/, '') || 'index';
  for (const l of [lang, fallbackLang]) {
    for (const f of [`${logical}.mdx`, `${logical}/index.mdx`]) {
      if (existsSync(join(docsDir, l, f))) return `${l}/${f}`;
    }
  }
  return null;
}

// Page a link found in `fromPage` points to (same page for a bare `#hash`).
function linkTarget(docsDir, link, fromPage, fallbackLang) {
  const { pathPart } = splitLink(link);
  return pathPart ? resolvePage(docsDir, pathPart, fallbackLang) : fromPage;
}

// "en/doc/index.mdx" → "doc/index.mdx" (language stripped).
const logicalOf = (page) => page && page.slice(page.indexOf('/') + 1);

// Every #hash link target of a text, in order.
export function hashLinks(text) {
  return [...text.matchAll(HASH_LINK_RE)].map((m) => m[1] || m[2]);
}

// Tagged paragraph ({/* t:p <hash> */}) enclosing a 1-based line.
export function paragraphAt(text, line) {
  const lines = text.split('\n');
  let start = -1;
  for (let i = Math.min(line, lines.length) - 1; i >= 0 && start < 0; i--) if (P_TAG_RE.test(lines[i])) start = i;
  if (start < 0) return null;
  let end = start + 1;
  while (end < lines.length && !P_TAG_RE.test(lines[end])) end++;
  return { hash: P_TAG_RE.exec(lines[start])[1], text: lines.slice(start + 1, end).join('\n') };
}

// Body of the paragraph tagged with `hash`, or null.
export function paragraphByHash(text, hash) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => P_TAG_RE.exec(l)?.[1] === hash);
  return start < 0 ? null : paragraphAt(text, start + 1).text;
}

// Source lines around a 1-based line, translation tags left out.
function contextAt(text, line) {
  const lines = text.split('\n');
  return lines.slice(Math.max(0, line - 3), line + 1).filter((l) => !ANY_TAG_RE.test(l))
    .join('\n').replace(/^(\s*\n)+|(\n\s*)+$/g, '');
}

// Main-language counterpart of a broken link in a translated page: the same
// paragraph (shared t:p hash) of the main file, the link at the same rank among
// those aiming at the same page, and its anchor mapped onto the target page by
// heading position. Null when the page is not a translation or nothing matches.
function mainHint(item, srcText, ctx) {
  const { docsDir, fallbackLang, headingsOf } = ctx;
  const doc = parseDoc(srcText);
  if (doc.role !== 'translated' || !doc.translatedFrom) return null;
  const mainPage = `${doc.translatedFrom}/${logicalOf(item.page)}`;
  if (!existsSync(join(docsDir, mainPage))) return null;
  const para = paragraphAt(srcText, item.lines[0]);
  const mainPara = para && paragraphByHash(readFileSync(join(docsDir, mainPage), 'utf8'), para.hash);
  if (!mainPara) return null;

  const aimsAtTarget = (from) => (l) => logicalOf(linkTarget(docsDir, l, from, fallbackLang)) === logicalOf(item.target);
  const srcLinks = hashLinks(para.text).filter(aimsAtTarget(item.page));
  const mainLinks = hashLinks(mainPara).filter(aimsAtTarget(mainPage));
  const rank = srcLinks.indexOf(item.link);
  const mainLink = mainLinks.length === srcLinks.length && rank >= 0 ? mainLinks[rank]
    : mainLinks.length === 1 ? mainLinks[0] : null;
  if (!mainLink) return null;

  const mainTarget = linkTarget(docsDir, mainLink, mainPage, fallbackLang);
  const mainAnchor = splitLink(mainLink).anchor;
  const mainHeadings = headingsOf(mainTarget);
  const index = mainHeadings.findIndex((h) => h.slug === mainAnchor);
  const hint = { lang: doc.translatedFrom, link: mainLink, targetPage: mainTarget, index };
  if (index < 0) return { ...hint, suggestion: null }; // the main link is broken too
  hint.heading = mainHeadings[index].text;
  hint.sameCount = mainHeadings.length === item.headings.length;
  hint.suggestion = mainTarget === item.target ? mainAnchor : item.headings[index]?.slug ?? null;
  return hint;
}

// Turn validator errors ({ docsPath, link, position }) into repair items, one
// per (page, link): every occurrence of a broken link is rewritten at once.
export function analyzeErrors(errors, { docsDir, fallbackLang }) {
  const cache = new Map();
  const headingsOf = (page) => {
    if (!cache.has(page)) {
      const abs = page && join(docsDir, page);
      cache.set(page, abs && existsSync(abs) ? headingSlugs(parseDoc(readFileSync(abs, 'utf8'))) : []);
    }
    return cache.get(page);
  };
  const ctx = { docsDir, fallbackLang, headingsOf };

  const items = new Map();
  for (const e of errors) {
    const key = `${e.docsPath} ${e.link}`;
    if (!items.has(key)) items.set(key, { page: e.docsPath, link: e.link, lines: [] });
    if (e.position) items.get(key).lines.push(e.position.line);
  }

  return [...items.values()].map((item, i) => {
    const abs = join(docsDir, item.page);
    const { pathPart, anchor } = splitLink(item.link);
    Object.assign(item, { id: i + 1, pathPart, anchor });
    if (!existsSync(abs)) return { ...item, problem: 'source page not found' };
    item.target = linkTarget(docsDir, item.link, item.page, fallbackLang);
    if (!item.target) return { ...item, problem: 'target page not found' };
    item.headings = headingsOf(item.target);
    if (!item.headings.length) return { ...item, problem: 'target page has no heading' };
    const text = readFileSync(abs, 'utf8');
    if (!item.lines.length) item.lines.push(text.split('\n').findIndex((l) => l.includes(item.link)) + 1);
    item.context = contextAt(text, item.lines[0]);
    item.hint = mainHint(item, text, ctx);
    return item;
  });
}

// Prompt block for one item (see config.prompts.fixLinks).
export function renderItem(item, rejected = []) {
  const out = [
    `<<<L ${item.id}>>>`,
    `file: ${item.page} (line ${item.lines.join(', ')})`,
    `broken link: ${item.link}`,
    'context:',
    ...item.context.split('\n').map((l) => `  | ${l}`),
    `target page: ${item.target}`,
    'valid anchors (#anchor <- heading text):',
    ...item.headings.map((h, i) => `  ${i + 1}. #${h.slug} <- ${h.text}`),
  ];
  const h = item.hint;
  if (h && h.suggestion) {
    out.push(
      `main-language hint: the ${h.lang} version of this paragraph links to ${h.link}, ` +
      `heading ${h.index + 1} ("${h.heading}") of ${h.targetPage}; ` +
      `heading ${h.index + 1} of the target page is #${h.suggestion}` +
      (h.sameCount ? '.' : ' (heading counts differ between both pages: check the heading text).'),
    );
  } else if (h) {
    out.push(`main-language hint: the ${h.lang} version links to ${h.link}, which is broken too: no positional hint.`);
  }
  if (rejected.length) out.push(`rejected earlier (not in the list): ${rejected.map((a) => `#${a}`).join(', ')}`);
  out.push(`<<<E ${item.id}>>>`);
  return out.join('\n');
}

// Agent answer → Map(id → { anchor } | { skip }). Tolerates list bullets,
// backticks, quotes and a leading '#' around the anchor.
export function parseFixAnswer(text) {
  const out = new Map();
  for (const line of text.replace(ANSI_RE, '').split('\n')) {
    const fix = line.match(/^[\s>*`-]*FIX\s+(\d+)\s+[`'"]?#?([^\s`'"]+)/);
    const skip = line.match(/^[\s>*`-]*SKIP\s+(\d+)\s*(.*)$/);
    if (fix) out.set(Number(fix[1]), { anchor: fix[2] });
    else if (skip && !out.has(Number(skip[1]))) out.set(Number(skip[1]), { skip: skip[2].trim() || 'no reason given' });
  }
  return out;
}

// Rewrite every occurrence of `link` used as a link target (preceded by `(`, a
// quote, `=` or `: ` as in YAML `link: /x/#y`, and not followed by more anchor
// characters, so `#a` never matches inside `#a-b` nor in prose) into `next`.
export function replaceLink(text, link, next) {
  const esc = link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<=[("'=]|:[ \\t])${esc}(?![\\p{L}\\p{N}_%-])`, 'gu');
  let count = 0;
  const out = text.replace(re, () => { count++; return next; });
  return { text: out, count };
}
