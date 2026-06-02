import { test } from 'node:test';
import assert from 'node:assert/strict';
import { headingText, headingSlugs, anchorSet, mapAnchor } from './anchors.mjs';

const doc = (...headings) => ({
  paragraphs: headings.map((h) => ({ hash: null, content: h })),
});

test('headingText: strips #, decodes entities, removes inline markdown', () => {
  assert.equal(headingText('### &#x1F4E6; darkone.host.desktop'), '📦 darkone.host.desktop');
  assert.equal(headingText('## A [link](/x) and `code`'), 'A link and code');
  assert.equal(headingText('## **bold** _italic_'), 'bold italic');
});

test('headingSlugs: reproduces Astro/github-slugger anchors', () => {
  const slugs = headingSlugs(doc(
    '## Modules mixin\n\ntext',
    '## Modules de sécurité',
    "## Modules d'administration",
    '### &#x1F4E6; darkone.host.desktop',
  )).map((h) => h.slug);
  assert.deepEqual(slugs, [
    'modules-mixin',
    'modules-de-sécurité',
    'modules-dadministration',
    '-darkonehostdesktop',
  ]);
});

test('headingSlugs: skips non-heading blocks, keeps document order', () => {
  const slugs = headingSlugs(doc(
    '<CardGrid stagger>\n  ...\n</CardGrid>', // no heading → skipped
    '## First',
    '## Second',
  )).map((h) => h.slug);
  assert.deepEqual(slugs, ['first', 'second']);
});

test('headingSlugs: ignores # lines inside fenced code blocks', () => {
  const slugs = headingSlugs(doc(
    '## Real heading',
    '```nix\n# usr/machines/foo.nix\ndarkone.x = 1;\n```',     // # comment, not a heading
    '## After code',
  )).map((h) => h.slug);
  assert.deepEqual(slugs, ['real-heading', 'after-code']);
});

test('headingSlugs: de-duplicates repeated headings like Astro', () => {
  const slugs = headingSlugs(doc('## Setup', '## Setup', '## Setup')).map((h) => h.slug);
  assert.deepEqual(slugs, ['setup', 'setup-1', 'setup-2']);
});

test('anchorSet: collects every valid anchor', () => {
  const set = anchorSet(doc('## Mixin modules', '## Service modules'));
  assert.ok(set.has('mixin-modules'));
  assert.ok(set.has('service-modules'));
  assert.equal(set.has('nope'), false);
});

test('mapAnchor: positional source→target mapping', () => {
  const src = headingSlugs(doc('## Modules mixin', '## Modules de service'));
  const tgt = headingSlugs(doc('## Mixin modules', '## Service modules'));
  assert.equal(mapAnchor(src, tgt, 'modules-mixin'), 'mixin-modules');
  assert.equal(mapAnchor(src, tgt, 'modules-de-service'), 'service-modules');
});

test('mapAnchor: returns null when anchor unknown or target shorter', () => {
  const src = headingSlugs(doc('## A', '## B'));
  const tgt = headingSlugs(doc('## X')); // only one heading
  assert.equal(mapAnchor(src, tgt, 'unknown-anchor'), null); // not in source
  assert.equal(mapAnchor(src, tgt, 'b'), null);              // no target[1]
});
