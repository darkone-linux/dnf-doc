#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

const args = process.argv.slice(2);
const idx = (s) => args.indexOf(s);
const newVer = args[idx('--new') + 1];
const oldVer = args[idx('--old') + 1];
const yes = args.includes('--yes') || args.includes('-y');

if (!newVer || !oldVer) {
  console.error('Usage: node scripts/update-changelog.mjs --old <version> --new <version>');
  process.exit(1);
}

const REPO = 'https://github.com/darkone-linux/dnf-doc';
const DATE = new Date().toISOString().split('T')[0];
const CHANGELOG = 'CHANGELOG.md';
const CHANGELOG_HEADER = `## [${newVer}] - ${DATE}`;

// Check if entry already exists (match version, ignore date)
const content = readFileSync(CHANGELOG, 'utf8');
if (new RegExp(`^## \\[${newVer}\\] - `, 'm').test(content)) {
  console.log(`Version ${newVer} already in CHANGELOG.md — skipping.`);
  process.exit(0);
}

// Get commits since the old version tag
let commits = [];
try {
  const log = execSync(`git log --format="%s" v${oldVer}..HEAD`, { encoding: 'utf8' }).trim();
  commits = log ? log.split('\n') : [];
} catch {
  // No commits since tag
}

// Categorize
const sections = { 'Added': [], 'Fixed': [], 'Changed': [], 'Removed': [], 'Deprecated': [], 'Security': [] };

function categorize(msg) {
  const l = msg.toLowerCase();
  if (/\b(add|new|create|implement|introduce)\b/.test(l)) return 'Added';
  if (/\b(fix|patch|correct|resolve|hotfix|bug)\b/.test(l)) return 'Fixed';
  if (/\b(remov|delet|drop|eliminate)\b/.test(l)) return 'Removed';
  if (/\bdeprecat\b/.test(l)) return 'Deprecated';
  if (/\b(security|cve|vuln)\b/.test(l)) return 'Security';
  return 'Changed';
}

for (const msg of commits) {
  const cat = categorize(msg);
  sections[cat].push(msg.charAt(0).toUpperCase() + msg.slice(1));
}

// Build version entry
const entry = [`## [${newVer}] - ${DATE}`, ''];
let hasContent = false;
for (const [heading, items] of Object.entries(sections)) {
  if (items.length === 0) continue;
  hasContent = true;
  entry.push(`### ${heading}`);
  for (const item of items) {
    entry.push(`- ${item}${item.endsWith('.') ? '' : '.'}`);
  }
  entry.push('');
}
if (!hasContent) {
  entry.push('_No significant changes._');
  entry.push('');
}

const versionBlock = entry.join('\n');

// Insert after ## [Unreleased] (walk past any content under it)
const lines = content.split('\n');
let insertAt = -1;
for (let i = 0; i < lines.length; i++) {
  if (/^## \[Unreleased\]/.test(lines[i])) {
    insertAt = i + 1;
    while (insertAt < lines.length && !/^## /.test(lines[insertAt])) {
      insertAt++;
    }
    break;
  }
}

if (insertAt === -1) {
  console.error('Could not find [Unreleased] section in CHANGELOG.md');
  process.exit(1);
}

lines.splice(insertAt, 0, versionBlock);
let updated = lines.join('\n');

// Update [Unreleased] comparison link
updated = updated.replace(
  /^\[Unreleased\]:.*/m,
  `[Unreleased]: ${REPO}/compare/v${newVer}...HEAD`
);

// Insert new version link before old version link
const oldLinkMarker = `[${oldVer}]:`;
if (updated.includes(oldLinkMarker)) {
  updated = updated.replace(
    oldLinkMarker,
    `[${newVer}]: ${REPO}/compare/v${oldVer}...v${newVer}\n${oldLinkMarker}`
  );
} else {
  updated += `\n[${newVer}]: ${REPO}/compare/v${oldVer}...v${newVer}\n[${oldVer}]: ${REPO}/releases/tag/v${oldVer}\n`;
}

console.log('\n--- Proposed changelog entry ---');
console.log(versionBlock);
console.log('--------------------------------\n');

if (!yes) {
  const ans = await ask('Write to CHANGELOG.md? (y/N) ');
  if (ans.toLowerCase() !== 'y' && ans.toLowerCase() !== 'yes') {
    console.log('Aborted.');
    rl.close();
    process.exit(0);
  }
}

writeFileSync(CHANGELOG, updated);
rl.close();
console.log(`Inserted entry for v${newVer} (${commits.length} commits since v${oldVer})`);
