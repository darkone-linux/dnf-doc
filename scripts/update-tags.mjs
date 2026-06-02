#!/usr/bin/env node
// Step 2 — assign roles and (re)compute tags.
//
// - Discovers languages and logical paths under docsDir.
// - For each logical path: picks the MAIN language (existing t:main wins, else
//   config.mainLang, else first available), the rest become translated-from.
// - MAIN files get t:main + t:h + a t:p hash before every paragraph.
// - Newly-tracked translated files only get the t:translated-from tag (NO hashes;
//   that is translate.mjs's job). Existing hashes are preserved.
// - Idempotent: a file is only rewritten when its serialization changes.

import { readFileSync, writeFileSync } from 'node:fs';
import config from './translate.config.mjs';
import { resolveDocsDir } from './lib/paths.mjs';
import { listLangs, buildFileMap } from './lib/fsmap.mjs';
import { parseDoc, serializeDoc, computeMainHashes } from './lib/mdx-doc.mjs';

const DRY = process.argv.slice(2).some((a) => ['--check', '-n', '--dry-run'].includes(a));
const docsDir = resolveDocsDir(config.docsDir);

function decideMain(present, langs, mainLang, logical) {
  const has = (l) => present.some((e) => e.lang === l);
  // 1. Explicit per-file override wins.
  const override = (config.mainOverrides || {})[logical];
  if (override && has(override)) return override;
  // 2. An existing t:main tag.
  const taggedMains = present.filter((e) => e.doc.role === 'main').map((e) => e.lang);
  if (taggedMains.length) return taggedMains.includes(mainLang) ? mainLang : taggedMains.sort()[0];
  // 2.5. No t:main left (eg. a codegen'd main lost its tags), but translations
  // still point at their source via t:translated-from: respect that pointer so
  // the source language is not flipped to mainLang. Consensus if several.
  const pointers = present
    .filter((e) => e.doc.role === 'translated' && e.doc.translatedFrom && has(e.doc.translatedFrom))
    .map((e) => e.doc.translatedFrom);
  if (pointers.length) {
    const counts = {};
    for (const p of pointers) counts[p] = (counts[p] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  }
  // 3. Default main language, else first available.
  if (has(mainLang)) return mainLang;
  for (const l of langs) if (has(l)) return l;
  return present[0].lang;
}

function writeIfChanged(path, text, doc) {
  const next = serializeDoc(doc);
  if (next === text) return false;
  if (!DRY) writeFileSync(path, next);
  return true;
}

function main() {
  const langs = listLangs(docsDir);
  const fileMap = buildFileMap(docsDir, langs, config.exclude);
  let written = 0, mains = 0, translated = 0;

  for (const [logical, byLang] of fileMap) {
    const present = Object.entries(byLang).map(([lang, path]) => {
      const text = readFileSync(path, 'utf8');
      return { lang, path, text, doc: parseDoc(text) };
    });
    const mainLang = decideMain(present, langs, config.mainLang, logical);

    for (const e of present) {
      if (e.lang === mainLang) {
        e.doc.role = 'main';
        e.doc.translatedFrom = null;
        computeMainHashes(e.doc);
        mains++;
        if (writeIfChanged(e.path, e.text, e.doc)) {
          written++;
          console.log(`  main      ${mainLang}/${logical}`);
        }
      } else {
        // translated: ensure role tag, keep any existing hashes, add none.
        const already = e.doc.role === 'translated' && e.doc.translatedFrom === mainLang;
        const wasMain = e.doc.role === 'main';
        e.doc.role = 'translated';
        e.doc.translatedFrom = mainLang;
        // Direction flipped (main -> translated): the old self-hashes no longer
        // reference the new main, so drop them. The file becomes untracked and
        // is protected by translate.mjs's conflict guard instead of being
        // overwritten from a possibly thinner main.
        if (wasMain) {
          e.doc.headerHash = null;
          for (const p of e.doc.paragraphs) p.hash = null;
        }
        translated++;
        if (writeIfChanged(e.path, e.text, e.doc)) {
          written++;
          console.log(`  ${already ? 'trans.   ' : 'trans+tag'} ${e.lang}/${logical} <- ${mainLang}`);
        }
      }
    }
  }

  console.log(
    `\n[update-tags]${DRY ? ' (dry-run)' : ''} langs=${langs.join(',')} ` +
    `mains=${mains} translated=${translated} written=${written}`,
  );
}

main();
