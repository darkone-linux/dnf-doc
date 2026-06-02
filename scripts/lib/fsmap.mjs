// Filesystem discovery: languages and logical-path map (no fixed inventory).
import { readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// Language directories directly under docsDir.
export function listLangs(docsDir) {
  return readdirSync(docsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function walk(dir, acc) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (/\.mdx$/.test(e.name)) acc.push(full);
  }
  return acc;
}

// Map logicalPath (path without the lang segment) -> { lang: absolutePath }.
export function buildFileMap(docsDir, langs, exclude = []) {
  const map = new Map();
  for (const lang of langs) {
    const langDir = join(docsDir, lang);
    if (!existsSync(langDir)) continue;
    for (const file of walk(langDir, [])) {
      const logical = relative(langDir, file).split(sep).join('/');
      if (exclude.some((re) => re.test(logical))) continue;
      if (!map.has(logical)) map.set(logical, {});
      map.get(logical)[lang] = file;
    }
  }
  return map;
}

export function targetPath(docsDir, lang, logical) {
  return join(docsDir, lang, ...logical.split('/'));
}
