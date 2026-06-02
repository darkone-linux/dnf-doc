import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcile } from './reconcile.mjs';

const main = {
  headerHash: 'H1',
  paragraphs: [{ hash: 'a', content: 'A' }, { hash: 'b', content: 'B' }],
};

test('new file: everything needs translation', () => {
  const r = reconcile(main, null, { adoptExisting: true });
  assert.equal(r.newFile, true);
  assert.equal(r.headerNeeds, true);
  assert.deepEqual(r.paragraphs.map((p) => p.needs), [true, true]);
  assert.deepEqual(r.paragraphs.map((p) => p.hash), ['a', 'b']);
  assert.equal(r.paragraphs[0].src, 'A');
});

test('adopt: untracked translation with matching paragraph count', () => {
  const trans = { headerHash: null, paragraphs: [{ hash: null, content: 'tA' }, { hash: null, content: 'tB' }] };
  const r = reconcile(main, trans, { adoptExisting: true });
  assert.equal(r.adopt, true);
  assert.deepEqual(r.paragraphs.map((p) => p.needs), [false, false]);
  assert.deepEqual(r.paragraphs.map((p) => [p.hash, p.content]), [['a', 'tA'], ['b', 'tB']]);
});

test('no adopt when count differs -> conflict flagged (protect manual work)', () => {
  const trans = { headerHash: null, paragraphs: [{ hash: null, content: 'tA' }] };
  const r = reconcile(main, trans, { adoptExisting: true });
  assert.equal(r.adopt, false);
  assert.equal(r.conflict, true); // untracked + content + diverging structure
  assert.deepEqual(r.paragraphs.map((p) => p.needs), [true, true]);
  assert.equal(r.headerNeeds, true);
});

test('new file and tracked files are never conflicts', () => {
  assert.equal(reconcile(main, null, {}).conflict, false);
  const tracked = { headerHash: 'H1', paragraphs: [{ hash: 'a', content: 'tA' }, { hash: 'b', content: 'tB' }] };
  assert.equal(reconcile(main, tracked, {}).conflict, false);
});

test('tracked & up to date: nothing needed', () => {
  const trans = { headerHash: 'H1', paragraphs: [{ hash: 'a', content: 'tA' }, { hash: 'b', content: 'tB' }] };
  const r = reconcile(main, trans, { adoptExisting: true });
  assert.deepEqual(r.paragraphs.map((p) => p.needs), [false, false]);
  assert.equal(r.headerNeeds, false);
});

test('changed paragraph re-queued, stale dropped, order follows main', () => {
  const main2 = { headerHash: 'H1', paragraphs: [{ hash: 'a2', content: 'A2' }, { hash: 'b', content: 'B' }] };
  const trans = { headerHash: 'H1', paragraphs: [{ hash: 'a', content: 'tA' }, { hash: 'b', content: 'tB' }] };
  const r = reconcile(main2, trans, { adoptExisting: true });
  assert.deepEqual(r.paragraphs.map((p) => p.hash), ['a2', 'b']); // 'a' (stale) dropped
  assert.deepEqual(r.paragraphs.map((p) => p.needs), [true, false]);
  assert.equal(r.paragraphs[0].src, 'A2');
});

test('header change is detected', () => {
  const trans = { headerHash: 'OLD', paragraphs: [{ hash: 'a', content: 'tA' }, { hash: 'b', content: 'tB' }] };
  const r = reconcile(main, trans, { adoptExisting: true });
  assert.equal(r.headerNeeds, true);
  assert.deepEqual(r.paragraphs.map((p) => p.needs), [false, false]);
});
