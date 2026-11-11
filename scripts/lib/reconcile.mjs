// Pure reconciliation logic between a MAIN doc and its translated counterpart.
// Decides, per paragraph, whether the translation is up-to-date, missing
// (needs translation) or stale (dropped). Kept separate so it is unit-testable
// without spawning agents or touching the filesystem.

import { paragraphHashes } from './mdx-doc.mjs';

// mainDoc: { headerHash, paragraphs:[{hash, content}] }  (content = source text)
// transDoc: parsed translated doc or null (when the file does not exist yet)
// opts: { adoptExisting, verbatimHeader }
// Returns: {
//   paragraphs: [{ hash, content, src, needs }],  // ordered like main
//   headerNeeds: bool,
//   headerVerbatim: bool, // frontmatter of identifiers only: copied, never
//                         // sent to an agent (so headerNeeds stays false)
//   adopt: bool,        // existing manual translation adopted as-is
//   newFile: bool,
//   conflict: bool,     // existing UNTRACKED translation whose structure diverges
//                       // from the main (overwriting would destroy manual work)
// }
export function reconcile(mainDoc, transDoc, opts = {}) {
  const rec = reconcileContent(mainDoc, transDoc, opts);
  const headerVerbatim = Boolean(opts.verbatimHeader);
  return { ...rec, headerNeeds: rec.headerNeeds && !headerVerbatim, headerVerbatim };
}

// A logical path whose every file is a translation of a language that has no
// file left: the source page was removed (or regenerated elsewhere, like a
// module reference page), so its translations go with it. Without this, the
// leftover would be promoted to main and translated back, resurrecting the page.
// present: [{ lang, doc }] for one logical path.
export function isOrphan(present) {
  const langs = new Set(present.map((e) => e.lang));
  return present.length > 0 && present.every(
    (e) => e.doc.role === 'translated' && e.doc.translatedFrom && !langs.has(e.doc.translatedFrom),
  );
}

function reconcileContent(mainDoc, transDoc, opts) {
  const mainParas = mainDoc.paragraphs;
  const newFile = !transDoc;

  // Adopt: a freshly-discovered translated file with no tracking tags yet, whose
  // paragraph count matches the main, is assumed to already be a valid
  // translation (preserve manual work instead of re-translating from scratch).
  const untracked = transDoc && paragraphHashes(transDoc).length === 0;
  if (opts.adoptExisting && untracked && transDoc.paragraphs.length === mainParas.length) {
    return {
      adopt: true,
      newFile: false,
      conflict: false,
      headerNeeds: false,
      paragraphs: mainParas.map((mp, i) => ({
        hash: mp.hash,
        content: transDoc.paragraphs[i].content,
        src: mp.content,
        needs: false,
      })),
    };
  }

  const byHash = new Map();
  if (transDoc) for (const p of transDoc.paragraphs) if (p.hash) byHash.set(p.hash, p.content);

  const paragraphs = mainParas.map((mp) => {
    if (byHash.has(mp.hash)) {
      return { hash: mp.hash, content: byHash.get(mp.hash), src: mp.content, needs: false };
    }
    return { hash: mp.hash, content: '', src: mp.content, needs: true };
  });

  // Only translate the header when the main actually has frontmatter content
  // (mainDoc.headerHash is null for an empty header → never send it to an agent).
  const headerNeeds = Boolean(mainDoc.headerHash) && (newFile || transDoc.headerHash !== mainDoc.headerHash);
  // An untracked file that still holds content but could not be adopted means a
  // pre-existing manual translation whose structure diverged from the main.
  const conflict = Boolean(untracked && transDoc.paragraphs.length > 0);
  return { adopt: false, newFile, conflict, headerNeeds, paragraphs };
}
