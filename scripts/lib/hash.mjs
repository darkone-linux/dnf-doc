// Blake3 hashing helpers for the translation tags.
import { blake3 } from '@noble/hashes/blake3.js';
import { bytesToHex } from '@noble/hashes/utils.js';

const enc = new TextEncoder();

// Normalize a chunk of text before hashing so that whitespace noise
// (trailing spaces, blank-line runs, surrounding newlines) does not change
// the hash. Mirrors the spirit of scripts/fix.mjs.
export function normalizeForHash(text) {
  return text
    .replace(/[ \t]+$/gm, '')   // strip trailing whitespace
    .replace(/\n{3,}/g, '\n\n') // collapse blank-line runs
    .trim();
}

// Blake3 hex digest of an already-normalized string.
export function blake3hex(str) {
  return bytesToHex(blake3(enc.encode(str)));
}

// Convenience: normalize then hash.
export function hashContent(text) {
  return blake3hex(normalizeForHash(text));
}
