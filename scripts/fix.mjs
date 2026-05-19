#!/usr/bin/env node

// Normalize markdown files: trailing whitespace, blank lines, tabs → 2 spaces.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DOCS = join(new URL('..', import.meta.url).pathname, 'src/content/docs');

function clean(file) {
  if (file.includes('/tmp/') || file.includes('/dist/')) return;
  let c = readFileSync(file, 'utf8');
  c = c
    .replace(/^[ \t]+$/gm, '')
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/\n{3}/g, '\n\n')
    .replace(/\n    }\s*\n[\n \t]*\n}/g, '\n    }\n}')
    .replace(/\n        }\s*\n[\n \t]*\n    }/g, '\n        }\n    }')
    .replace(/[ \t]+$/gm, '')
    .replace(/\t/g, '  ');
  writeFileSync(file, c.trim() + '\n');
}

function parse(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    statSync(full).isDirectory() ? parse(full) : /\.mdx?$/.test(entry) && clean(full);
  }
}

parse(DOCS);

