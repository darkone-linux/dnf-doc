// Pure material for `just update-changelog` (scripts/update-changelog.mjs):
// parse the framework's Keep a Changelog file and render one English page per
// release plus the changelog home page. No I/O here, so it is unit-testable.
//
// Page layout (under <lang>/<dir>/, logical paths stay language-free):
//   index.mdx          home: one section per series, one line per release
//   v<X>-<Y>-<Z>.mdx   one page per release (dots dropped: Astro slugs strip them)

// `## [0.3.1] - 2026-09-25` release heading; `[Unreleased]` has no date.
const RELEASE_RE = /^## \[([^\]]+)\](?:\s+-\s+(\d{4}-\d{2}-\d{2}))?\s*$/;
// `[0.3.1]: https://…` reference links of the footer.
const LINK_RE = /^\[([^\]]+)\]:\s*(\S+)\s*$/;
const SECTION_RE = /^###\s+(.*)$/;
const LIST_RE = /^\s*(?:[-*+]|\d+\.)\s/;
const FENCE_RE = /^\s*(```|~~~)/;

// Keep a Changelog section weights for the fallback headline: what a reader
// cares about first. Unknown sections weigh 1.
const SECTION_WEIGHTS = { breaking: 3, added: 2, security: 2, fixed: 1, changed: 1, removed: 1, documentation: 0.5, dependencies: 0 };

// Parse the changelog. Returns releases newest first (Unreleased skipped):
// [{ version, date, body, url }], `body` being the raw Markdown under the
// release heading and `url` its footer reference link (compare/tag), if any.
export function parseChangelog(text) {
  const lines = text.split('\n');
  const links = {};
  for (const l of lines) {
    const m = LINK_RE.exec(l);
    if (m) links[m[1]] = m[2];
  }
  const releases = [];
  let cur = null;
  for (const l of lines) {
    const m = RELEASE_RE.exec(l);
    if (m) {
      cur = m[2] ? { version: m[1], date: m[2], lines: [] } : null;
      if (cur) releases.push(cur);
      continue;
    }
    if (cur && !LINK_RE.test(l)) cur.lines.push(l);
  }
  return releases
    .map(({ version, date, lines: body }) => ({ version, date, body: body.join('\n').trim(), url: links[version] || null }))
    .sort((a, b) => compareVersions(b.version, a.version));
}

// SemVer order: numeric MAJOR.MINOR.PATCH, a pre-release sorts before its release.
export function compareVersions(a, b) {
  const split = (v) => {
    const [core, pre = null] = v.split(/-(.*)/s);
    return { nums: core.split('.').map(Number), pre };
  };
  const x = split(a), y = split(b);
  for (let i = 0; i < 3; i++) {
    const d = (x.nums[i] || 0) - (y.nums[i] || 0);
    if (d) return d;
  }
  if (x.pre === y.pre) return 0;
  if (x.pre === null) return 1;
  if (y.pre === null) return -1;
  return x.pre.localeCompare(y.pre, 'en', { numeric: true });
}

// File/URL slug of a version: 0.3.1 → v0-3-1.
export function versionSlug(version) {
  return 'v' + version.toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/^-|-$/g, '');
}

// Home page section a release belongs to. In 0.x the MINOR carries the
// breaking changes, so each 0.Y line is its own series; from 1.0 on, the MAJOR.
export function seriesOf(version) {
  const [major, minor] = version.split(/[.-]/).map(Number);
  return major === 0 ? `0.${minor}.x` : `${major}.x`;
}

// ` — X — Y` → ` (X) Y`, ` — X.` → ` (X).`: the doc bans the em dash, a
// parenthesis keeps the aside readable. The aside runs to the next dash, to the
// end of the sentence (`.`/`;` + space) or to the end of the line.
export function dashToParens(line) {
  return line.replace(/ — (.+?)( — |(?=[.;](?:\s|$))|$)/g, (_, inner, end) => ` (${inner})${end ? ' ' : ''}`);
}

// Escape what MDX would parse as JSX or expressions, outside inline code.
export function escapeMdx(line) {
  return line
    .split(/(`+[^`]*`+)/)
    .map((seg, i) => (i % 2 ? seg : seg.replace(/[{}<]/g, (c) => '\\' + c)))
    .join('');
}

const isTable = (l) => /^\s*\|/.test(l);
const isHeading = (l) => /^#{1,6}\s/.test(l);

// Soft-wrapped prose and list items of a release body are joined into one line
// each, so asides and escapes see whole sentences. Headings, tables and code
// fences stay verbatim; blank lines keep separating blocks.
function unwrap(lines) {
  const out = [];
  let inFence = false;
  let open = false; // the last line is prose/list text a wrapped line continues
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (FENCE_RE.test(line)) { inFence = !inFence; out.push(line); open = false; continue; }
    if (inFence) { out.push(line); continue; }
    if (!line) { if (out.length && out[out.length - 1] !== '') out.push(''); open = false; continue; }
    const verbatim = isTable(line) || isHeading(line);
    if (verbatim || LIST_RE.test(line) || !open) {
      out.push(verbatim || LIST_RE.test(line) ? line : line.trim());
      open = !verbatim;
      continue;
    }
    out[out.length - 1] += ' ' + line.trim();
  }
  return out;
}

// Release body → page body: `### Section` becomes `## Section`, the
// `⚠ Breaking` section becomes a caution callout, text is MDX-safe.
export function renderReleaseBody(body) {
  const CALLOUT = ':::caution[Breaking changes]';
  const out = [];
  let inFence = false;
  let callout = false;
  const closeCallout = () => {
    if (!callout) return;
    while (out[out.length - 1] === '') out.pop();
    out.push(':::', '');
    callout = false;
  };
  for (const line of unwrap(body.split('\n'))) {
    if (FENCE_RE.test(line)) { inFence = !inFence; out.push(line); continue; }
    if (inFence) { out.push(line); continue; }
    const s = SECTION_RE.exec(line);
    if (s) {
      closeCallout();
      if (/breaking/i.test(s[1])) { out.push(CALLOUT); callout = true; }
      else out.push(`## ${s[1].trim()}`, '');
      continue;
    }
    if (!line && out[out.length - 1] === CALLOUT) continue;
    out.push(isTable(line) ? escapeMdx(line) : escapeMdx(dashToParens(line)));
  }
  closeCallout();
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Deterministic headline when no agent answer is usable: the most weighted
// `**scope**` labels of the release (Breaking > Added/Security > others).
export function fallbackHeadline(body) {
  const score = new Map();
  let weight = 1;
  let order = 0;
  for (const line of body.split('\n')) {
    const s = SECTION_RE.exec(line);
    if (s) {
      const key = Object.keys(SECTION_WEIGHTS).find((k) => s[1].toLowerCase().includes(k));
      weight = key ? SECTION_WEIGHTS[key] : 1;
      continue;
    }
    const m = /^\s*[-*+]\s+\*\*([^*]+)\*\*/.exec(line);
    if (!m || !weight) continue;
    const e = score.get(m[1]) || { w: 0, order: order++ };
    e.w += weight;
    score.set(m[1], e);
  }
  const top = [...score].sort((a, b) => b[1].w - a[1].w || a[1].order - b[1].order).slice(0, 3).map(([k]) => k);
  if (!top.length) return 'Maintenance release';
  const text = top.join(', ');
  return text[0].toUpperCase() + text.slice(1);
}

// Clean an agent headline; null when unusable (the fallback then applies).
export function sanitizeHeadline(text) {
  const h = String(text || '')
    .replace(/[`*_"<>{}]/g, '')
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.;:,]+$/, '');
  return h && h.length <= 90 ? h : null;
}

// Agent answer → { version: headline } from `H <version> <headline>` lines.
export function parseHeadlines(text) {
  const out = {};
  for (const line of String(text).replace(/\x1b\[[0-9;]*m/g, '').split('\n')) {
    const m = /^\s*H\s+v?(\S+)\s+(.+)$/.exec(line);
    if (!m) continue;
    const h = sanitizeHeadline(m[2]);
    if (h) out[m[1]] = h;
  }
  return out;
}

// Agent prompt body: one <<<R version>>> block per release.
export function headlinesBody(releases) {
  return releases.map((r) => `<<<R ${r.version}>>>\n${r.body}\n<<<E ${r.version}>>>`).join('\n\n');
}

// `description:` of a page frontmatter (the stored headline), or null.
export function readDescription(text) {
  const fm = /^---[ \t]*\n([\s\S]*?)\n---/.exec(text);
  const m = fm && /^description:[ \t]*(.+)$/m.exec(fm[1]);
  if (!m) return null;
  const v = m[1].trim();
  if (v.startsWith('"')) {
    try { return JSON.parse(v); } catch { return null; }
  }
  return v.replace(/^'(.*)'$/, '$1');
}

const q = (s) => JSON.stringify(s); // YAML-safe double-quoted scalar
const pageLink = (lang, dir, version) => `/${lang}/${dir}/${versionSlug(version)}/`;

// One release page. `older`/`newer` are the neighbour releases (or null),
// wired as Starlight's prev/next links: the pages are not in the sidebar.
export function renderReleasePage(release, { headline, older, newer, lang, dir }) {
  const fm = [
    `title: ${q(`Version ${release.version}`)}`,
    `description: ${q(headline)}`,
    'sidebar:',
    `  label: ${q(release.version)}`,
    `lang: ${lang}`,
  ];
  if (older) fm.push('prev:', `  link: ${pageLink(lang, dir, older.version)}`, `  label: ${q(`Version ${older.version}`)}`);
  if (newer) fm.push('next:', `  link: ${pageLink(lang, dir, newer.version)}`, `  label: ${q(`Version ${newer.version}`)}`);

  const links = [];
  if (release.url) links.push(`[Changes on GitHub](${release.url})`);
  links.push(`[All versions](/${lang}/${dir}/)`);

  return [
    '---', ...fm, '---', '',
    `Released on **${release.date}**: ${escapeMdx(headline)}.`, '',
    links.join(' · '), '',
    renderReleaseBody(release.body), '',
  ].join('\n');
}

// Changelog home page: one section per series, one line per release.
export function renderIndex(releases, { headlines, lang, dir, repoUrl, versionsPage }) {
  const series = new Map();
  for (const r of releases) {
    const s = seriesOf(r.version);
    if (!series.has(s)) series.set(s, []);
    series.get(s).push(r);
  }
  const out = [
    '---',
    'title: Changelog',
    `description: ${q('Release notes of the Darkone NixOS Framework, one page per version.')}`,
    'sidebar:',
    '  label: Changelog',
    '  order: 1',
    `lang: ${lang}`,
    '---', '',
    ':::note[Pre-alpha release]',
    'This version of the framework is functional but may still change.',
    'A first stable "alpha" version will be available soon.',
    ':::', '',
    'One page per release, newest first, generated from the framework',
    `[CHANGELOG](${repoUrl}/blob/main/CHANGELOG.md).`,
    'While in `0.x`, a **minor** version may break compatibility: read its',
    `**Breaking changes** before upgrading (see [versions](${versionsPage})).`,
    '',
  ];
  for (const [name, rs] of series) {
    out.push(`## Version ${name}`, '');
    for (const r of rs) out.push(`- [${r.version}](${pageLink(lang, dir, r.version)}) (${r.date}): ${escapeMdx(headlines[r.version])}`);
    out.push('');
  }
  return out.join('\n');
}
