import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashContent, normalizeForHash } from './hash.mjs';
import {
  parseDoc, serializeDoc, computeMainHashes, paragraphHashes,
} from './mdx-doc.mjs';

const MAIN_UNTAGGED = `---
title: Administrator Guide
sidebar:
  order: 3
lang: en
---

import { Steps } from '@astrojs/starlight/components';

This section is dedicated to administrators.

## Preparation

We will install in order:

1. a machine (the administrator's),
2. a gateway.
`;

test('hash is deterministic and whitespace-insensitive', () => {
  assert.equal(hashContent('hello\nworld'), hashContent('hello\nworld  \n'));
  assert.notEqual(hashContent('a'), hashContent('b'));
  assert.equal(normalizeForHash('x\n\n\n\ny  '), 'x\n\ny');
});

test('parseDoc splits frontmatter, preamble and paragraphs', () => {
  const doc = parseDoc(MAIN_UNTAGGED);
  assert.match(doc.frontmatter, /title: Administrator Guide/);
  assert.equal(doc.role, null);
  assert.equal(doc.preamble, "import { Steps } from '@astrojs/starlight/components';");
  assert.equal(doc.paragraphs.length, 2);
  assert.equal(doc.paragraphs[0].content, 'This section is dedicated to administrators.');
  assert.match(doc.paragraphs[1].content, /^## Preparation/);
  assert.ok(doc.paragraphs.every((p) => p.hash === null));
});

test('computeMainHashes fills header + paragraph hashes', () => {
  const doc = computeMainHashes(parseDoc(MAIN_UNTAGGED));
  assert.match(doc.headerHash, /^[0-9a-f]{64}$/);
  assert.equal(paragraphHashes(doc).length, 2);
  // Same content => same paragraph hash (stable id).
  assert.equal(doc.paragraphs[0].hash, hashContent('This section is dedicated to administrators.'));
});

test('serialize -> parse round-trips a tagged main', () => {
  const doc = computeMainHashes(parseDoc(MAIN_UNTAGGED));
  doc.role = 'main';
  const text = serializeDoc(doc);
  // Tags present and ordered: t:main, t:h before the import.
  assert.match(text, /\{\/\* t:main \*\/\}\n\{\/\* t:h [0-9a-f]{64} \*\/\}\n\nimport \{ Steps \}/);
  const re = parseDoc(text);
  assert.equal(re.role, 'main');
  assert.equal(re.headerHash, doc.headerHash);
  assert.equal(re.preamble, doc.preamble);
  assert.deepEqual(paragraphHashes(re), paragraphHashes(doc));
  // Idempotent serialization.
  assert.equal(serializeDoc(re), text);
});

test('parses a translated file (tags before imports)', () => {
  const FR = `---
title: Guide
lang: fr
---

{/* t:translated-from en */}
{/* t:h aaaa */}

import { Steps } from '@astrojs/starlight/components';

{/* t:p 1111 */}
Cette section est dédiée aux administrateurs.

{/* t:p 2222 */}
## Préparation

Texte.
`;
  const doc = parseDoc(FR);
  assert.equal(doc.role, 'translated');
  assert.equal(doc.translatedFrom, 'en');
  assert.equal(doc.headerHash, 'aaaa');
  assert.equal(doc.preamble, "import { Steps } from '@astrojs/starlight/components';");
  assert.deepEqual(paragraphHashes(doc), ['1111', '2222']);
  assert.equal(doc.paragraphs[0].content, 'Cette section est dédiée aux administrateurs.');
});

test('headings inside code fences are not split points', () => {
  const FENCED = `---
lang: en
---

## Code

\`\`\`bash
# not a heading
echo hi
\`\`\`

Done.
`;
  const doc = parseDoc(FENCED);
  assert.equal(doc.paragraphs.length, 1);
  assert.match(doc.paragraphs[0].content, /# not a heading/);
  assert.match(doc.paragraphs[0].content, /Done\./);
});
