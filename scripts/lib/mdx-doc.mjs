// Parse / serialize a Starlight MDX document into a tagged-translation model.
//
// A document is split into:
//   - frontmatter : the YAML between the leading `---` fences
//   - role tags   : {/* t:main */} or {/* t:translated-from <lang> */}
//   - header hash : {/* t:h <hex> */}  (blake3 of the MAIN frontmatter)
//   - preamble    : the import/export block right after the header (never hashed)
//   - paragraphs  : blocks split on ATX headings (^#{1,6} ), each optionally
//                   preceded by {/* t:p <hex> */}
//
// Paragraph and header hashes are STABLE ids: identical in a main file and in
// all of its translations, so a content change flips the hash and marks the
// matching translated paragraph as stale.

import { hashContent, normalizeForHash } from './hash.mjs';

const TAG_RE = /^\{\/\*\s*t:([a-z][a-z-]*)(?:\s+(.*?))?\s*\*\/\}$/;
const HEADING_RE = /^#{1,6}\s+\S/;
const FENCE_RE = /^\s*(```|~~~)/;
const IMPORT_RE = /^\s*(import|export)\s/;

// Collect the leading import/export block (blank lines allowed between
// statements). Returns the preamble text and the remaining lines.
function extractPreamble(lines) {
  const pre = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.trim() === '') { i++; continue; }
    if (IMPORT_RE.test(l)) { pre.push(l); i++; continue; }
    break;
  }
  return { preamble: pre.join('\n').trim(), rest: lines.slice(i) };
}

// Split content lines into paragraph blocks at ATX headings, ignoring headings
// inside fenced code blocks. Each block is normalized; empty blocks dropped.
function splitByHeadings(lines) {
  const blocks = [];
  let cur = [];
  let inFence = false;
  const flush = () => { const b = normalizeForHash(cur.join('\n')); if (b) blocks.push(b); };
  for (const line of lines) {
    if (FENCE_RE.test(line)) inFence = !inFence;
    if (!inFence && HEADING_RE.test(line)) { flush(); cur = [line]; }
    else cur.push(line);
  }
  flush();
  return blocks;
}

export function parseDoc(text) {
  // 1. Frontmatter
  let frontmatter = '';
  let hasFrontmatter = false;
  let body = text;
  const fm = text.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*\n?/);
  if (fm) {
    hasFrontmatter = true;
    frontmatter = fm[1].replace(/\s+$/, '');
    body = text.slice(fm[0].length);
  }

  // 2. Pull out role / header / paragraph tags; keep the rest as items.
  let role = null, translatedFrom = null, headerHash = null;
  const items = []; // string (content line) | { pTag }
  for (const line of body.split('\n')) {
    const m = TAG_RE.exec(line.trim());
    if (m) {
      const [, kind, raw] = m;
      const val = (raw || '').trim() || null;
      if (kind === 'main') role = 'main';
      else if (kind === 'translated-from') { role = 'translated'; translatedFrom = val; }
      else if (kind === 'h') headerHash = val;
      else if (kind === 'p') items.push({ pTag: val });
      // unknown t:* tags are dropped
      continue;
    }
    items.push(line);
  }

  // 3. Head buffer (before first t:p) vs explicit tagged paragraphs.
  const head = [];
  const explicit = [];
  let cur = null;
  for (const it of items) {
    if (typeof it === 'object') { cur = { hash: it.pTag, lines: [] }; explicit.push(cur); }
    else if (cur) cur.lines.push(it);
    else head.push(it);
  }

  // 4. Preamble + untagged paragraphs from the head buffer.
  const { preamble, rest } = extractPreamble(head);
  const paragraphs = [];
  for (const block of splitByHeadings(rest)) paragraphs.push({ hash: null, content: block });
  for (const u of explicit) {
    const content = normalizeForHash(u.lines.join('\n'));
    if (content) paragraphs.push({ hash: u.hash, content });
  }

  return { hasFrontmatter, frontmatter, role, translatedFrom, headerHash, preamble, paragraphs };
}

export function serializeDoc(doc) {
  let out = '';
  if (doc.hasFrontmatter) out += '---\n' + doc.frontmatter.replace(/\s+$/, '') + '\n---\n\n';

  const tags = [];
  if (doc.role === 'main') tags.push('{/* t:main */}');
  else if (doc.role === 'translated') tags.push(`{/* t:translated-from ${doc.translatedFrom} */}`);
  if (doc.headerHash) tags.push(`{/* t:h ${doc.headerHash} */}`);
  if (tags.length) out += tags.join('\n') + '\n\n';

  if (doc.preamble) out += doc.preamble + '\n\n';

  for (const p of doc.paragraphs) {
    if (p.hash) out += `{/* t:p ${p.hash} */}\n`;
    out += p.content + '\n\n';
  }
  return out.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

// Compute (or refresh) the header + paragraph hashes from the document content.
// Used for MAIN files only. Mutates and returns the doc.
export function computeMainHashes(doc) {
  doc.headerHash = hashContent(doc.frontmatter);
  for (const p of doc.paragraphs) p.hash = hashContent(p.content);
  return doc;
}

// Ordered list of the document's paragraph hashes (skips untagged paragraphs).
export function paragraphHashes(doc) {
  return doc.paragraphs.filter((p) => p.hash).map((p) => p.hash);
}
