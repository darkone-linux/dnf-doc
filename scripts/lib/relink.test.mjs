import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLink, relinkParagraph, relinkFile } from './relink.mjs';
import { headingSlugs } from './anchors.mjs';

// Headings of a page from [hash, markdown] paragraphs.
const page = (...paras) => headingSlugs({ paragraphs: paras.map(([hash, content]) => ({ hash, content })) });

// fr main page and its en translation: same t:p hashes, headings translated.
const PAGES = {
  'fr doc': page(['h1', '## Sous le capot'], ['h2', '## Organisation des fichiers']),
  'en doc': page(['h1', '## Under the hood'], ['h2', '## File organization']),
  'fr self': page(['s1', '## Permissions'], ['s2', '## Migrer un serveur']),
  'en self': page(['s1', '## Permissions'], ['s2', '## Migrating a server']),
};
const ctx = { tgt: 'en', mainLang: 'fr', headings: (lang, path) => PAGES[`${lang} ${path ?? 'self'}`] || [] };

test('parseLink: page key, base and anchor', () => {
  assert.deepEqual(parseLink('/en/doc/#a'), { lang: 'en', path: 'doc', key: 'doc', base: '/en/doc/', anchor: 'a' });
  assert.deepEqual(parseLink('#a'), { lang: null, path: null, key: '', base: '', anchor: 'a' });
});

test('relinkParagraph: main-language anchor fresh from the agent → target heading', () => {
  const out = relinkParagraph('See [x](/en/doc/#organisation-des-fichiers).', '', ctx);
  assert.equal(out, 'See [x](/en/doc/#file-organization).');
});

test('relinkParagraph: stale anchor (target heading retranslated) → main counterpart', () => {
  const main = 'Voir [a](/fr/doc/#sous-le-capot) et [b](/fr/doc/#organisation-des-fichiers).';
  const out = relinkParagraph('See [a](/en/doc/#under-the-hood) and [b](/en/doc/#file-layout).', main, ctx);
  assert.equal(out, 'See [a](/en/doc/#under-the-hood) and [b](/en/doc/#file-organization).');
});

test('relinkParagraph: same-page links, href form', () => {
  const main = '<A href="#migrer-un-serveur" />';
  assert.equal(relinkParagraph('<A href="#migrate-a-live-server" />', main, ctx), '<A href="#migrating-a-server" />');
});

test('relinkParagraph: valid, cross-language and unsure links are left as is', () => {
  const text = '[ok](/en/doc/#under-the-hood) [fr](/fr/doc/#nope) [?](/en/doc/#nope)';
  const main = '[a](/fr/doc/#sous-le-capot) [b](/fr/doc/#organisation-des-fichiers)';
  // 3 links to doc vs 2 in the main → no rank pairing, #nope unknown in fr too.
  assert.equal(relinkParagraph(text, main, ctx), text);
});

test('relinkFile: pairs paragraphs by t:p hash, keeps other bytes', () => {
  const main = '---\ntitle: T\n---\n\n{/* t:main */}\n\n{/* t:p p1 */}\nVoir [x](/fr/doc/#organisation-des-fichiers).\n';
  const text = '---\ntitle: T\n---\n\n{/* t:translated-from fr */}\n\n{/* t:p p1 */}\nSee [x](/en/doc/#file-layout).\n';
  assert.equal(relinkFile(text, main, ctx), text.replace('#file-layout', '#file-organization'));
});
