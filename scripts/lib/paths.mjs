// Resolve the doc/ root and the docs directory regardless of cwd.
import { fileURLToPath } from 'node:url';
import { dirname, join, isAbsolute } from 'node:path';

// scripts/lib/paths.mjs -> doc/ root is two levels up.
export const docRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function resolveDocsDir(docsDir) {
  return isAbsolute(docsDir) ? docsDir : join(docRoot, docsDir);
}
