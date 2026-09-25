#!/usr/bin/env node
// `just build` with automatic repair of "invalid hash" links by an AI agent.
//
//   1. run the build; green → done;
//   2. red: read the links validator JSON report. No report (the build died
//      elsewhere) or any error other than "invalid hash" → stop, nothing here
//      can fix it;
//   3. otherwise, for each broken link, compute the target page's real anchors
//      and the main-language hint (lib/link-fix.mjs), ask ONE agent call to pick
//      an anchor per link, check each answer against the real anchors, rewrite
//      only the #hash in the source page, then rebuild.
//
// At most config.fixLinks.maxRounds agent rounds; a round that fixes nothing is
// retried without rebuilding. Exits with the last build status.
// Use --check / -n for a dry run: build once and print the prompt, change nothing.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import config from './translate.config.mjs';
import { docRoot, resolveDocsDir } from './lib/paths.mjs';
import { runAgent, commandExists } from './lib/agent.mjs';
import { analyzeErrors, renderItem, parseFixAnswer, replaceLink } from './lib/link-fix.mjs';

const argv = process.argv.slice(2);
const DRY = argv.some((a) => ['--check', '-n', '--dry-run'].includes(a));

const docsDir = resolveDocsDir(config.docsDir);
// Written by starlight-links-validator (`reporters.json` in astro.config.mjs).
const REPORT = join(docRoot, '.starlight-links-validator', 'errors.json');
const { tool, model, maxRounds, timeoutMs, retries, retryBaseMs, buildCmd } = config.fixLinks;
const log = (msg) => console.log(`[fix-links] ${msg}`);

function build() {
  rmSync(REPORT, { force: true }); // a build dying before validation must not leave a stale report
  const [cmd, ...args] = buildCmd;
  return spawnSync(cmd, args, { cwd: docRoot, stdio: 'inherit' }).status ?? 1;
}

// Unfixable errors (other kinds, unresolved pages) are listed; returns the
// fixable "invalid hash" items, or null when the build failed for another reason.
function fixableItems() {
  if (!existsSync(REPORT)) {
    log('the build failed outside link validation: no link to fix.');
    return null;
  }
  const { errors } = JSON.parse(readFileSync(REPORT, 'utf8'));
  const other = errors.filter((e) => e.message !== 'invalid hash');
  if (other.length) {
    log(`${other.length} link error(s) other than "invalid hash", not auto-fixable:`);
    for (const e of other) console.error(`  ✖ ${e.docsPath}:${e.position?.line ?? '?'}  ${e.link}  (${e.message})`);
    return null;
  }
  const items = analyzeErrors(errors, { docsDir, fallbackLang: config.mainLang });
  for (const i of items.filter((i) => i.problem)) console.error(`  ✖ ${i.page}  ${i.link}  (${i.problem})`);
  return items.filter((i) => !i.problem);
}

// Apply the agent's answers. Returns the number of links rewritten; refused
// answers are remembered in `rejected` and shown to the agent next round.
function applyAnswers(items, answers, rejected) {
  let applied = 0;
  for (const item of items) {
    const key = `${item.page} ${item.link}`;
    const ans = answers.get(item.id);
    const where = `${item.page}:${item.lines.join(',')}  #${item.anchor}`;
    if (!ans) { console.error(`  ✖ ${where}: no answer`); continue; }
    if (ans.skip) { console.error(`  ✖ ${where}: skipped by the agent (${ans.skip})`); continue; }
    if (!item.headings.some((h) => h.slug === ans.anchor)) {
      console.error(`  ✖ ${where} → #${ans.anchor}: refused, not an anchor of ${item.target}`);
      rejected.set(key, [...(rejected.get(key) || []), ans.anchor]);
      continue;
    }
    const abs = join(docsDir, item.page);
    const { text, count } = replaceLink(readFileSync(abs, 'utf8'), item.link, `${item.pathPart}#${ans.anchor}`);
    if (!count) { console.error(`  ✖ ${where}: link not found in the source`); continue; }
    writeFileSync(abs, text);
    applied++;
    const via = item.hint?.suggestion === ans.anchor ? ' (main-language hint)' : '';
    console.log(`  ✓ ${where} → #${ans.anchor}${via}`);
  }
  return applied;
}

async function main() {
  let status = build();
  const rejected = new Map();
  let round = 0;
  while (status !== 0) {
    const items = fixableItems();
    if (!items) return status;
    if (!items.length) { log('no fixable link left.'); return status; }

    const prompt = config.prompts.fixLinks.replace('{{body}}',
      items.map((i) => renderItem(i, rejected.get(`${i.page} ${i.link}`))).join('\n\n'));
    if (DRY) { log(`dry-run: ${items.length} link(s) to fix, agent prompt:\n`); console.log(prompt); return status; }
    if (round >= maxRounds) { log(`${items.length} link(s) still broken after ${maxRounds} round(s): giving up.`); return status; }
    if (!commandExists(tool)) { log(`agent tool "${tool}" not found on PATH. Set FIXLINKS_TOOL or install it.`); return status; }

    round++;
    log(`round ${round}/${maxRounds}: ${items.length} invalid hash link(s), asking ${tool} (${model})...`);
    let answers = new Map();
    try {
      const { cmd, args } = config.command(tool, model);
      const out = await runAgent({ cmd, args, input: prompt, timeoutMs, retries, baseDelayMs: retryBaseMs });
      answers = parseFixAnswer(out);
    } catch (e) {
      console.error(`  ✖ agent: ${e.message}`);
    }
    // Nothing rewritten → same errors: next round without a rebuild.
    if (applyAnswers(items, answers, rejected)) status = build();
  }
  log(round ? `build green after ${round} round(s) of link fixes.` : 'build green, no link to fix.');
  return status;
}

process.exit(await main());
