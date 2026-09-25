import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import {
  splitLink, hashLinks, paragraphAt, paragraphByHash,
  analyzeErrors, renderItem, parseFixAnswer, replaceLink,
} from './link-fix.mjs';

test('splitLink: path part and anchor', () => {
  assert.deepEqual(splitLink('/en/doc/#file-layout'), { pathPart: '/en/doc/', anchor: 'file-layout' });
  assert.deepEqual(splitLink('#permissions'), { pathPart: '', anchor: 'permissions' });
});

test('hashLinks: markdown and href targets carrying a #hash, in order', () => {
  const text = '[a](/fr/x/#un) [b](/fr/y/) [c](#deux) <LinkCard href="/fr/z/#trois" />';
  assert.deepEqual(hashLinks(text), ['/fr/x/#un', '#deux', '/fr/z/#trois']);
});

test('paragraphAt / paragraphByHash: tagged block around a line', () => {
  const text = '{/* t:p aaa */}\n## One\n\nbody one\n\n{/* t:p bbb */}\n## Two\nbody two';
  assert.deepEqual(paragraphAt(text, 4), { hash: 'aaa', text: '## One\n\nbody one\n' });
  assert.equal(paragraphAt(text, 8).hash, 'bbb');
  assert.equal(paragraphByHash(text, 'bbb'), '## Two\nbody two');
  assert.equal(paragraphByHash(text, 'zzz'), null);
});

test('parseFixAnswer: FIX / SKIP lines, tolerant to decorations', () => {
  const got = parseFixAnswer('Sure:\n- `FIX 1 #file-layout`\nFIX 2 "organisation-des-fichiers"\nSKIP 3 nothing fits\nnoise');
  assert.deepEqual(got.get(1), { anchor: 'file-layout' });
  assert.deepEqual(got.get(2), { anchor: 'organisation-des-fichiers' });
  assert.deepEqual(got.get(3), { skip: 'nothing fits' });
  assert.equal(got.size, 3);
});

test('replaceLink: only exact link targets, never a longer anchor', () => {
  const text = '[a](#perm) [b](#perm-x) <A href="#perm" /> text #perm';
  const { text: out, count } = replaceLink(text, '#perm', '#permissions');
  assert.equal(count, 2);
  assert.equal(out, '[a](#permissions) [b](#perm-x) <A href="#permissions" /> text #perm');
});

test('analyzeErrors: target anchors + main-language positional hint', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'link-fix-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const put = (p, s) => { mkdirSync(dirname(join(dir, p)), { recursive: true }); writeFileSync(join(dir, p), s); };
  put('fr/doc/index.mdx', '{/* t:main */}\n\n{/* t:p h1 */}\n## Sous le capot\n\n{/* t:p h2 */}\n## Organisation des fichiers\n');
  put('en/doc/index.mdx', '{/* t:translated-from fr */}\n\n{/* t:p h1 */}\n## Under the hood\n\n{/* t:p h2 */}\n## File layout\n');
  put('fr/doc/a.mdx', '{/* t:main */}\n\n{/* t:p p1 */}\nVoir [x](/fr/doc/#sous-le-capot) et [y](/fr/doc/#organisation-des-fichiers).\n');
  put('en/doc/a.mdx', '{/* t:translated-from fr */}\n\n{/* t:p p1 */}\nSee [x](/en/doc/#under-the-hood) and [y](/en/doc/#organisation-des-fichiers).\n');

  const [item] = analyzeErrors(
    [{ docsPath: 'en/doc/a.mdx', link: '/en/doc/#organisation-des-fichiers', position: { line: 4, column: 1 } }],
    { docsDir: dir, fallbackLang: 'fr' },
  );
  assert.equal(item.problem, undefined);
  assert.equal(item.target, 'en/doc/index.mdx');
  assert.deepEqual(item.headings.map((h) => h.slug), ['under-the-hood', 'file-layout']);
  assert.equal(item.hint.suggestion, 'file-layout');
  const block = renderItem(item, ['bogus']);
  assert.match(block, /^<<<L 1>>>/);
  assert.match(block, /whose translation in the target page is #file-layout/);
  assert.match(block, /rejected earlier \(not in the list\): #bogus/);

  const [missing] = analyzeErrors(
    [{ docsPath: 'en/doc/a.mdx', link: '/en/nowhere/#x', position: null }],
    { docsDir: dir, fallbackLang: 'fr' },
  );
  assert.equal(missing.problem, 'target page not found');
});
