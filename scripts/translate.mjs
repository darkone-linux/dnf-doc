#!/usr/bin/env node
// Step 3 — incremental translation of every MAIN file into the other languages.
//
// For each main file and each target language:
//   - load (or create) the translated file,
//   - reconcile paragraphs by hash: keep up-to-date ones, queue missing ones,
//     drop stale ones, reorder to follow the main,
//   - ask one AI agent per file to translate the queued paragraphs (+ header),
//   - write the translated file so its tags match the main exactly.
//
// Agents run in parallel (config.agent.concurrency, 1 per file).
// Use --check / -n for a dry run that lists work without calling any agent.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import config, { LANG_NAMES } from './translate.config.mjs';
import { resolveDocsDir } from './lib/paths.mjs';
import { listLangs, buildFileMap, targetPath } from './lib/fsmap.mjs';
import { parseDoc, serializeDoc, computeMainHashes } from './lib/mdx-doc.mjs';
import { reconcile } from './lib/reconcile.mjs';
import { runAgent, pMap, commandExists } from './lib/agent.mjs';
import { headingSlugs, mapAnchor } from './lib/anchors.mjs';

const argv = process.argv.slice(2);
const DRY = argv.some((a) => ['--check', '-n', '--dry-run'].includes(a));
const FORCE = argv.some((a) => ['--force', '-f'].includes(a));
const onlyArg = argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice('--only='.length) : null;

const docsDir = resolveDocsDir(config.docsDir);
const langName = (l) => LANG_NAMES[l] || l;

function render(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : `{{${k}}}`));
}

// Rewrite only the SOURCE language locale prefix in internal links; links to
// other languages stay intact (intentional cross-language references).
function rewriteLinks(text, src, tgt) {
  return text
    .split(`](/${src}/`).join(`](/${tgt}/`)
    .replace(new RegExp(`href=(["'])/${src}/`, 'g'), `href=$1/${tgt}/`)
    .replace(new RegExp(`(\\blink:\\s*)/${src}/`, 'g'), `$1/${tgt}/`);
}

function swapLang(frontmatter, tgt) {
  return frontmatter.replace(/^lang:[ \t].*$/m, `lang: ${tgt}`);
}

// Heading slugs of a page on disk, cached by absolute path.
const slugCache = new Map();
function slugsForFile(absPath) {
  if (slugCache.has(absPath)) return slugCache.get(absPath);
  let slugs = [];
  try { slugs = headingSlugs(parseDoc(readFileSync(absPath, 'utf8'))); } catch { /* missing → no slugs */ }
  slugCache.set(absPath, slugs);
  return slugs;
}

// Rewrite `#anchor` targets deterministically (the agent must NOT guess them).
// Two cases handled; everything else (cross-language links, external URLs, an
// unknown anchor) is left untouched for the link validator to flag.
//   - same page  ](#a)            : map via the current file's src↔tgt headings
//   - cross page  ](/<tgt>/p/#a)  : map via <mainLang>/p ↔ <tgt>/p headings
function resolveAnchors(text, ctx) {
  const { docsDir, mainLang, tgt, srcSlugs, tgtSlugs } = ctx;
  return text.replace(/\]\((#[^)\s]+|\/[a-z]{2}\/[^)\s]*?#[^)\s]+)\)/g, (full, target) => {
    if (target.startsWith('#')) {
      if (srcSlugs.length !== tgtSlugs.length) return full; // partial file → don't risk a mismap
      const mapped = mapAnchor(srcSlugs, tgtSlugs, target.slice(1));
      return mapped ? `](#${mapped})` : full;
    }
    const m = target.match(/^\/([a-z]{2})\/(.*?)#(.+)$/);
    if (!m) return full;
    const [, lang, pathPart, anchor] = m;
    if (lang !== tgt) return full; // intentional cross-language reference
    const logical = pathPart.replace(/\/$/, '');
    if (!logical) return full;
    const mapped = mapAnchor(
      slugsForFile(join(docsDir, mainLang, `${logical}.mdx`)),
      slugsForFile(join(docsDir, tgt, `${logical}.mdx`)),
      anchor,
    );
    return mapped ? `](/${tgt}/${pathPart}#${mapped})` : full;
  });
}

function parseAgentOutput(text) {
  const out = { header: null, paras: {} };
  const h = text.match(/<<<HEADER>>>\n?([\s\S]*?)\n?<<<EHEADER>>>/);
  if (h) out.header = h[1].trim();
  const re = /<<<T (\S+)>>>\n?([\s\S]*?)\n?<<<E \1>>>/g;
  let m;
  while ((m = re.exec(text))) out.paras[m[1]] = m[2].trim();
  return out;
}

// Build the list of per-file translation jobs (no agent calls here).
function planJobs() {
  const langs = listLangs(docsDir);
  const fileMap = buildFileMap(docsDir, langs, config.exclude);
  const jobs = [];

  for (const [logical, byLang] of fileMap) {
    if (ONLY && !logical.includes(ONLY)) continue;
    for (const [lang, path] of Object.entries(byLang)) {
      const doc = parseDoc(readFileSync(path, 'utf8'));
      if (doc.role !== 'main') continue;
      computeMainHashes(doc); // ensure hashes match current content
      const mainLang = lang;

      for (const tgt of langs) {
        if (tgt === mainLang) continue;
        const tPath = targetPath(docsDir, tgt, logical);
        const tDoc = existsSync(tPath) ? parseDoc(readFileSync(tPath, 'utf8')) : null;
        const rec = reconcile(doc, tDoc, config);
        // --force re-translates everything (header + every paragraph), not just
        // the conflict-guard override — useful to refresh anchors/wording.
        if (FORCE) { rec.headerNeeds = true; for (const p of rec.paragraphs) p.needs = true; }
        const paraJobs = rec.paragraphs.filter((p) => p.needs);
        const allowOverwrite = FORCE || (config.regenerate || []).includes(logical);
        jobs.push({
          logical, mainLang, tgt, tPath, mainDoc: doc, tDoc, rec, paraJobs,
          headerNeeds: rec.headerNeeds, conflict: rec.conflict && !allowOverwrite,
        });
      }
    }
  }
  return { langs, jobs };
}

function buildPrompt(job, paras, includeHeader) {
  let body = '';
  // Never ask an agent to translate an empty header.
  if (includeHeader && job.mainDoc.frontmatter && job.mainDoc.frontmatter.trim()) {
    body += `<<<HEADER>>>\n${job.mainDoc.frontmatter}\n<<<EHEADER>>>\n\n`;
  }
  for (const p of paras) body += `<<<T ${p.hash}>>>\n${p.src}\n<<<E ${p.hash}>>>\n\n`;
  return render(config.prompts.translate, {
    srcLang: job.mainLang, tgtLang: job.tgt,
    srcName: langName(job.mainLang), tgtName: langName(job.tgt),
    body: body.trim(),
  });
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Split a file's agent work into bounded tasks (a chunk of paragraphs + maybe
// the header). Results from all tasks of a file are merged before writing.
function buildTasks(job, maxParas) {
  job.got = { header: null, paras: {} };
  const groups = job.paraJobs.length ? chunk(job.paraJobs, maxParas) : [[]];
  return groups.map((paras, i) => ({ job, paras, includeHeader: job.headerNeeds && i === 0 }));
}

// Assemble and write the translated file from reconciled paragraphs + agent
// results (`got` may be null when nothing needed an agent: adopt / reorder).
function writeTranslated(job, got) {
  const { mainDoc, tgt, mainLang, rec } = job;
  let frontmatter;
  let headerHash = mainDoc.headerHash;

  if (job.headerNeeds) {
    if (got && got.header) frontmatter = swapLang(rewriteLinks(got.header, mainLang, tgt), tgt);
    else { frontmatter = swapLang(mainDoc.frontmatter, tgt); headerHash = null; } // retry next run
  } else {
    // Unchanged header, or an empty one on a brand-new file (tDoc may be null).
    frontmatter = job.tDoc ? job.tDoc.frontmatter : swapLang(mainDoc.frontmatter, tgt);
  }

  const paragraphs = [];
  for (const p of rec.paragraphs) {
    if (!p.needs) { paragraphs.push({ hash: p.hash, content: p.content }); continue; }
    const tr = got && got.paras[p.hash];
    if (tr) paragraphs.push({ hash: p.hash, content: rewriteLinks(tr, mainLang, tgt) });
    // else: omit -> stays "missing", retried next run (self-healing).
  }

  // Deterministic anchor resolution (after locale rewrite): src↔tgt headings are
  // positionally aligned, so #anchors map exactly instead of being guessed.
  const anchorCtx = {
    docsDir, mainLang, tgt,
    srcSlugs: headingSlugs(mainDoc),
    tgtSlugs: headingSlugs({ paragraphs }),
  };
  for (const p of paragraphs) p.content = resolveAnchors(p.content, anchorCtx);

  const preamble = job.tDoc?.preamble || mainDoc.preamble;
  const doc = {
    hasFrontmatter: true, frontmatter, role: 'translated', translatedFrom: mainLang,
    headerHash, preamble, paragraphs,
  };
  const text = serializeDoc(doc);
  const changed = !existsSync(job.tPath) || readFileSync(job.tPath, 'utf8') !== text;
  if (changed && !DRY) { mkdirSync(dirname(job.tPath), { recursive: true }); writeFileSync(job.tPath, text); }
  return changed;
}

async function main() {
  const { langs, jobs } = planJobs();
  const conflicts = jobs.filter((j) => j.conflict);
  const active = jobs.filter((j) => !j.conflict);
  const agentJobs = active.filter((j) => j.paraJobs.length || j.headerNeeds);
  const writeOnly = active.filter((j) => !j.paraJobs.length && !j.headerNeeds);

  for (const j of conflicts) {
    console.warn(
      `  ⚠ skip ${j.tgt}/${j.logical}: existing untracked translation diverges from ` +
      `${j.mainLang} main (${j.tDoc.paragraphs.length} vs ${j.mainDoc.paragraphs.length} paragraphs). ` +
      `Set mainOverrides or rerun with --force to overwrite.`,
    );
  }

  const totalParas = agentJobs.reduce((n, j) => n + j.paraJobs.length, 0);
  console.log(
    `[translate]${DRY ? ' (dry-run)' : ''} langs=${langs.join(',')} ` +
    `files-needing-agent=${agentJobs.length} paragraphs=${totalParas} ` +
    `headers=${agentJobs.filter((j) => j.headerNeeds).length}`,
  );
  for (const j of agentJobs) {
    console.log(`  → ${j.tgt}/${j.logical}  (${j.paraJobs.length} para${j.headerNeeds ? ' + header' : ''})`);
  }

  // write-only jobs (adopt / reorder / stale-drop): no agent needed.
  let written = 0;
  for (const j of writeOnly) if (writeTranslated(j, null)) { written++; if (!DRY) console.log(`  ✓ ${j.tgt}/${j.logical} (no agent)`); }

  if (DRY) { console.log(`[translate] dry-run: ${written} file(s) would change without agent.`); return; }
  if (!agentJobs.length) { console.log(`[translate] up to date. ${written} file(s) updated.`); return; }

  const { tool, model, concurrency, timeoutMs, maxParasPerCall } = config.agent;
  if (!commandExists(tool)) {
    console.error(`[translate] agent tool "${tool}" not found on PATH. Set TRANSLATE_TOOL or install it.`);
    process.exit(1);
  }
  const { cmd, args } = config.command(tool, model);

  // Bounded tasks across all files, run with shared concurrency.
  const tasks = agentJobs.flatMap((j) => buildTasks(j, maxParasPerCall));
  console.log(`[translate] dispatching ${tasks.length} agent call(s) (max ${maxParasPerCall} para/call, concurrency ${concurrency})`);
  await pMap(tasks, async (task) => {
    const { job } = task;
    const prompt = buildPrompt(job, task.paras, task.includeHeader);
    try {
      const out = await runAgent({ cmd, args, input: prompt, timeoutMs });
      const got = parseAgentOutput(out);
      if (got.header) job.got.header = got.header;
      Object.assign(job.got.paras, got.paras);
      const miss = task.paras.filter((p) => !got.paras[p.hash]).length;
      if (miss && process.env.TRANSLATE_DEBUG) {
        const tag = task.paras[0] ? task.paras[0].hash.slice(0, 8) : 'header';
        const dbg = `/tmp/translate-debug-${job.tgt}-${job.logical.replace(/\//g, '_')}-${tag}.txt`;
        writeFileSync(dbg, `PROMPT:\n${prompt}\n\n===OUTPUT (${out.length} chars)===\n${out}`);
        console.error(`    debug dumped to ${dbg}`);
      }
    } catch (e) {
      console.error(`  ✖ ${job.tgt}/${job.logical} chunk: ${e.message}`);
    }
  }, concurrency);

  // Assemble + write each file once, after all its chunks have run.
  for (const job of agentJobs) {
    const missing = job.paraJobs.filter((p) => !job.got.paras[p.hash]).length;
    if (writeTranslated(job, job.got)) written++;
    const note = missing ? ` ⚠ ${missing}/${job.paraJobs.length} paragraph(s) not returned (will retry)` : '';
    console.log(`  ✓ ${job.tgt}/${job.logical}${note}`);
  }

  console.log(`[translate] done. ${written} file(s) updated.`);
}

main();
