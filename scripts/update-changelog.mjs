#!/usr/bin/env node
// `just update-changelog` — changelog pages from the framework CHANGELOG.md.
//
//   1. parse the source changelog (config.changelog.source);
//   2. no release without its page → nothing to do (unless --force);
//   3. one agent call writes a one-line headline per new release (fallback:
//      its dominant scopes); a page keeps its headline in `description:`;
//   4. (re)write every release page (prev/next links follow the new
//      neighbours) and the home page, only when their content changes.
//
// Pages are written in config.changelog.lang only, already tagged as the main
// (the output `just tags` would produce): `just translate`, which `just update`
// runs next, produces the other languages. The sidebar only links the home page.
// Flags: --check / -n (dry run, no agent, nothing written), --force (rewrite
// the pages even without a new release; stored headlines are kept).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import config from './translate.config.mjs';
import { docRoot, resolveDocsDir } from './lib/paths.mjs';
import { parseDoc, serializeDoc, computeMainHashes } from './lib/mdx-doc.mjs';
import { runAgent, commandExists } from './lib/agent.mjs';
import {
  parseChangelog, versionSlug, fallbackHeadline, parseHeadlines, headlinesBody,
  readDescription, renderReleasePage, renderIndex,
} from './lib/changelog.mjs';

const argv = process.argv.slice(2);
const DRY = argv.some((a) => ['--check', '-n', '--dry-run'].includes(a));
const FORCE = argv.some((a) => ['--force', '-f'].includes(a));

const cfg = config.changelog;
const source = resolve(docRoot, cfg.source);
const outDir = join(resolveDocsDir(config.docsDir), cfg.lang, cfg.dir);
const log = (msg) => console.log(`[changelog] ${msg}`);

const pagePath = (version) => join(outDir, `${versionSlug(version)}.mdx`);

// Tag the page as the main, exactly as update-tags.mjs would: rewriting an
// unchanged page is then a no-op.
function asMain(text) {
  const doc = parseDoc(text);
  doc.role = 'main';
  doc.translatedFrom = null;
  return serializeDoc(computeMainHashes(doc));
}

function write(path, text) {
  const next = asMain(text);
  const exists = existsSync(path);
  if (exists && readFileSync(path, 'utf8') === next) return false;
  if (!DRY) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, next); }
  console.log(`  ${exists ? 'update' : 'create'} ${cfg.lang}/${cfg.dir}/${path.slice(outDir.length + 1)}`);
  return true;
}

// Headlines of the new releases: one agent call, fallback per missing answer.
async function headlinesFor(releases) {
  const out = {};
  if (!DRY && commandExists(cfg.tool)) {
    const prompt = config.prompts.changelogHeadlines.replace('{{body}}', headlinesBody(releases));
    try {
      const { cmd, args } = config.command(cfg.tool, cfg.model);
      const answer = await runAgent({ cmd, args, input: prompt, timeoutMs: cfg.timeoutMs, retries: cfg.retries, baseDelayMs: cfg.retryBaseMs });
      Object.assign(out, parseHeadlines(answer));
    } catch (e) {
      console.error(`  ✖ headline agent: ${e.message}`);
    }
  } else if (!DRY) {
    console.error(`  ✖ agent tool "${cfg.tool}" not found on PATH (set CHANGELOG_TOOL): fallback headlines.`);
  }
  for (const r of releases) {
    if (out[r.version]) continue;
    out[r.version] = fallbackHeadline(r.body);
    if (!DRY) console.warn(`  ⚠ ${r.version}: no agent headline, fallback "${out[r.version]}"`);
  }
  return out;
}

async function main() {
  if (!existsSync(source)) {
    log(`source ${source} not found (set CHANGELOG_SOURCE): skipped.`);
    return;
  }
  const releases = parseChangelog(readFileSync(source, 'utf8'));
  if (!releases.length) { log('no release in the source changelog: skipped.'); return; }

  const fresh = releases.filter((r) => !existsSync(pagePath(r.version)));
  if (!fresh.length && !FORCE) { log(`up to date (${releases.length} releases).`); return; }
  log(`${fresh.length} new release(s)${fresh.length ? ': ' + fresh.map((r) => r.version).join(', ') : ''}${DRY ? ' (dry-run)' : ''}`);

  const headlines = await headlinesFor(fresh);
  for (const r of releases) {
    if (headlines[r.version]) continue;
    headlines[r.version] = readDescription(readFileSync(pagePath(r.version), 'utf8')) || fallbackHeadline(r.body);
  }

  let written = 0;
  releases.forEach((r, i) => {
    const page = renderReleasePage(r, {
      headline: headlines[r.version], newer: releases[i - 1] || null, older: releases[i + 1] || null,
      lang: cfg.lang, dir: cfg.dir,
    });
    if (write(pagePath(r.version), page)) written++;
  });
  const index = renderIndex(releases, { headlines, lang: cfg.lang, dir: cfg.dir, repoUrl: cfg.repoUrl, versionsPage: cfg.versionsPage });
  if (write(join(outDir, 'index.mdx'), index)) written++;

  log(`${written} file(s) ${DRY ? 'would change' : 'written'}.`);
}

main();
