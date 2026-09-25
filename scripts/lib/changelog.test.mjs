import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseChangelog, compareVersions, versionSlug, seriesOf, dashToParens, escapeMdx,
  renderReleaseBody, fallbackHeadline, sanitizeHeadline, parseHeadlines,
  readDescription, renderReleasePage, renderIndex,
} from './changelog.mjs';

const CHANGELOG = `# Changelog

Intro — not a release.

## [Unreleased]

## [0.2.0] - 2026-09-22

### ⚠ Breaking

- **machines**: Split usr/machines by provenance

### Added

- **gateway**: Backup links with health-checked failover
- **gateway**: Standby wifi radios
- **alerts**: One message to a Matrix room

### Fixed

- **alerts**: Keep firing across retries

## [0.1.0] - 2026-09-09

First versioned release. What is new is the contract — a version consumers
can pin, a changelog.

### Added

- **Services**: around forty daemons behind Caddy — Nextcloud,
  Forgejo, nix-cache (Harmonia).
- **Module system**: \`darkone.{system,admin}.*\` namespaces, a \`dnf-<version>\` label

| Project | Version |
|---|---|
| [dnf-doc](https://github.com/darkone-linux/dnf-doc) | \`0.1.x\` |

[Unreleased]: https://example.org/compare/v0.2.0...HEAD
[0.2.0]: https://example.org/compare/v0.1.0...v0.2.0
[0.1.0]: https://example.org/releases/tag/v0.1.0
`;

test('parseChangelog: releases newest first, Unreleased and footer skipped', () => {
  const rs = parseChangelog(CHANGELOG);
  assert.deepEqual(rs.map((r) => [r.version, r.date, r.url]), [
    ['0.2.0', '2026-09-22', 'https://example.org/compare/v0.1.0...v0.2.0'],
    ['0.1.0', '2026-09-09', 'https://example.org/releases/tag/v0.1.0'],
  ]);
  assert.match(rs[0].body, /^### ⚠ Breaking/);
  assert.doesNotMatch(rs[1].body, /\[0\.1\.0\]:/);
});

test('compareVersions / versionSlug / seriesOf', () => {
  assert.ok(compareVersions('0.10.0', '0.9.9') > 0);
  assert.ok(compareVersions('1.0.0-rc.1', '1.0.0') < 0);
  assert.equal(compareVersions('0.3.1', '0.3.1'), 0);
  assert.equal(versionSlug('0.3.1'), 'v0-3-1');
  assert.equal(versionSlug('1.0.0-rc.1'), 'v1-0-0-rc-1');
  assert.equal(seriesOf('0.3.1'), '0.3.x');
  assert.equal(seriesOf('2.1.0'), '2.x');
});

test('dashToParens: asides end at a dash, a sentence end or the line end', () => {
  assert.equal(dashToParens('the contract — a version, a changelog. Then'), 'the contract (a version, a changelog). Then');
  assert.equal(dashToParens('colmena — `just apply`; cache'), 'colmena (`just apply`); cache');
  assert.equal(dashToParens('a — b — c'), 'a (b) c');
  assert.equal(dashToParens('tiers — unit, VM'), 'tiers (unit, VM)');
});

test('escapeMdx: braces and < escaped outside inline code only', () => {
  assert.equal(escapeMdx('a {b} <c> `{d} <e>`'), 'a \\{b\\} \\<c> `{d} <e>`');
});

test('renderReleaseBody: sections, breaking callout, unwrapped items, table kept', () => {
  const [r2, r1] = parseChangelog(CHANGELOG);
  assert.equal(renderReleaseBody(r2.body).split('\n## Added')[0],
    ':::caution[Breaking changes]\n- **machines**: Split usr/machines by provenance\n:::\n');
  const b1 = renderReleaseBody(r1.body);
  assert.match(b1, /^First versioned release\. What is new is the contract \(a version consumers can pin, a changelog\)\.\n\n## Added\n\n/);
  assert.match(b1, /\n- \*\*Services\*\*: around forty daemons behind Caddy \(Nextcloud, Forgejo, nix-cache \(Harmonia\)\)\.\n/);
  assert.match(b1, /`darkone\.\{system,admin\}\.\*` namespaces, a `dnf-<version>` label/);
  assert.match(b1, /\n\| Project \| Version \|\n\|---\|---\|\n/);
  assert.doesNotMatch(b1, /—/);
});

test('fallbackHeadline: weighted scopes, breaking first', () => {
  const [r2] = parseChangelog(CHANGELOG);
  assert.equal(fallbackHeadline(r2.body), 'Gateway, machines, alerts');
  assert.equal(fallbackHeadline('### Fixed\n\n- plain item'), 'Maintenance release');
});

test('parseHeadlines / sanitizeHeadline', () => {
  const got = parseHeadlines('noise\n\x1b[0mH 0.2.0 **Gateway** failover — wifi backup.\nH v0.1.0 First release\nH 0.0.1 \n');
  assert.deepEqual(got, { '0.2.0': 'Gateway failover, wifi backup', '0.1.0': 'First release' });
  assert.equal(sanitizeHeadline('x'.repeat(120)), null);
});

test('renderReleasePage: frontmatter, prev/next, headline stored and readable', () => {
  const [r2, r1] = parseChangelog(CHANGELOG);
  const page = renderReleasePage(r2, { headline: 'Gateway: failover', older: r1, newer: null, lang: 'en', dir: 'changelog' });
  assert.match(page, /^---\ntitle: "Version 0\.2\.0"\ndescription: "Gateway: failover"\nsidebar:\n  label: "0\.2\.0"\nlang: en\nprev:\n  link: \/en\/changelog\/v0-1-0\/\n  label: "Version 0\.1\.0"\n---\n/);
  assert.doesNotMatch(page, /\nnext:/);
  assert.match(page, /Released on \*\*2026-09-22\*\*: Gateway: failover\.\n\n\[Changes on GitHub\]\(https:\/\/example\.org\/compare\/v0\.1\.0\.\.\.v0\.2\.0\) · \[All versions\]\(\/en\/changelog\/\)/);
  assert.equal(readDescription(page), 'Gateway: failover');
  assert.equal(readDescription('---\ndescription: plain text\n---\n'), 'plain text');
  assert.equal(readDescription('no frontmatter'), null);
});

test('renderIndex: one section per series, one line per release', () => {
  const rs = parseChangelog(CHANGELOG);
  const idx = renderIndex(rs, {
    headlines: { '0.2.0': 'Gateway failover', '0.1.0': 'First release' },
    lang: 'en', dir: 'changelog', repoUrl: 'https://example.org', versionsPage: '/en/doc/versions/',
  });
  assert.match(idx, /\n## Version 0\.2\.x\n\n- \[0\.2\.0\]\(\/en\/changelog\/v0-2-0\/\) \(2026-09-22\): Gateway failover\n\n## Version 0\.1\.x\n\n- \[0\.1\.0\]\(\/en\/changelog\/v0-1-0\/\) \(2026-09-09\): First release\n$/);
});
