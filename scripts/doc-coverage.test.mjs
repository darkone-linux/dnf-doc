// Hand-written and generated pages against what they describe: a recipe, a
// `config.yaml` key or a module category added to the framework must reach the
// documentation. The framework is read from the workspace (`../dnf`); its
// checks are skipped where the doc is checked out alone.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { docRoot } from './lib/paths.mjs';

const frDoc = join(docRoot, 'src/content/docs/fr/doc');
const dnf = join(docRoot, '..', 'dnf');
const read = (path) => readFileSync(path, 'utf8');
const hasFramework = existsSync(join(dnf, 'just'));

function hasJust() {
  try { execFileSync('just', ['--version'], { stdio: 'ignore' }); return true; } catch { return false; }
}

// Public recipes of a bootstrap: [{ name, aliases }].
function recipes(bootstrap) {
  const dump = JSON.parse(execFileSync(
    'just', ['--justfile', join(dnf, 'just', bootstrap), '--dump', '--dump-format', 'json'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  ));
  const aliases = Object.entries(dump.aliases).map(([alias, { target }]) => ({ alias, target }));
  return Object.values(dump.recipes)
    .filter((r) => !r.private)
    .map((r) => ({ name: r.name, aliases: aliases.filter((a) => a.target === r.name).map((a) => a.alias) }));
}

test('justfile.mdx: every public recipe has its entry', { skip: !hasFramework || !hasJust() }, () => {
  const page = read(join(frDoc, 'admin-guide/operate/justfile.mdx'));

  // An entry is a `###` heading naming the recipe, or one of its aliases, as
  // the first word of a code span: "### ✳️ `apply <cible> [action]` / `a`".
  const documented = new Set();
  for (const heading of page.match(/^### .*$/gm) || []) {
    for (const [, name] of heading.matchAll(/`([a-z][a-z0-9-]*)/g)) documented.add(name);
  }

  const missing = new Set();
  for (const bootstrap of ['dnf.just', 'project.just', 'codev.just']) {
    for (const r of recipes(bootstrap)) {
      if (![r.name, ...r.aliases].some((n) => documented.has(n))) missing.add(r.name);
    }
  }
  assert.deepEqual([...missing].sort(), [], 'recipes without a "### `<recipe>`" entry');
});

test('config.mdx: every config.yaml key is named', { skip: !hasFramework }, () => {
  const schema = JSON.parse(read(join(dnf, 'config/config.schema.json')));
  const keys = new Set();
  (function walk(node) {
    if (!node || typeof node !== 'object') return;
    for (const key of Object.keys(node.properties || {})) keys.add(key);
    for (const child of Object.values(node)) walk(child);
  })(schema);
  assert.ok(keys.size > 20, 'schema keys not found: has its layout changed?');

  const page = read(join(frDoc, 'how-to/admin/config.mdx'));
  const named = (key) => new RegExp(`(?<![\\w-])${key}(?![\\w-])`).test(page);
  assert.deepEqual([...keys].filter((k) => !named(k)).sort(), [], 'config.yaml keys the page never names');
});

test('sidebar: one group per category of the module reference', () => {
  const reference = join(docRoot, 'src/content/docs/en/ref/modules');
  const categories = readdirSync(reference, { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const config = read(join(docRoot, 'astro.config.mjs'));
  const groups = [...config.matchAll(/directory: "ref\/modules\/([^"/]+)"/g)].map((m) => m[1]).sort();
  assert.ok(categories.length > 0, 'no category under en/ref/modules');
  assert.deepEqual(groups, categories);
});
