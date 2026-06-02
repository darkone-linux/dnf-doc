// Single configuration for the incremental documentation translation task.
// Every value can be overridden via environment variables (see below).
const env = process.env;

export default {
  // Where the localized docs live (relative to the doc/ root).
  docsDir: 'src/content/docs',

  // Default source language when a pair of untagged files is discovered.
  mainLang: env.TRANSLATE_MAINLANG || 'fr',

  // Per-file main-language overrides, keyed by logical path (language stripped).
  // Highest priority when deciding which language is the source of truth.
  mainOverrides: {
    // EN holds the legacy specs and must stay the protected source: keep FR as
    // the (stub) main so the rich EN file is never overwritten nor translated.
    'doc/specifications.mdx': 'fr',
    'index.mdx': 'fr',
  },

  // Logical paths whose existing translation should be regenerated from the
  // main even though it diverges (overrides the conflict guard for these only).
  regenerate: [
    'doc/how-to.mdx',
    'doc/introduction.mdx',
  ],

  // Logical paths (language-stripped) excluded from tagging/translation.
  // Example: skip the auto-generated module reference.
  exclude: [
    // /^ref\//,
  ],

  // On first tracking of an existing translated file, adopt its paragraphs as
  // up-to-date when their count matches the main (preserves manual work instead
  // of re-translating everything).
  adoptExisting: true,

  agent: {
    tool: env.TRANSLATE_TOOL || 'opencode', // 'claude' | 'opencode'
    model: env.TRANSLATE_MODEL || 'opencode/big-pickle', // 'claude-haiku-4-5',
    concurrency: Number(env.TRANSLATE_CONCURRENCY || 4), // parallel agent calls
    timeoutMs: Number(env.TRANSLATE_TIMEOUT || 300000), // large files need headroom
    // Max paragraphs sent to a single agent call. A file with more is split into
    // several calls (reliable parsing + avoids timeouts/output truncation), then
    // reassembled into one translated file.
    maxParasPerCall: Number(env.TRANSLATE_CHUNK || 12),
  },

  // Command builder: returns { cmd, args }; the prompt is piped on stdin.
  command(tool, model) {
    if (tool === 'opencode') return { cmd: 'opencode', args: ['run', '-m', model] };
    return { cmd: 'claude', args: ['-p', '--model', model] };
  },

  prompts: {
    // Placeholders: {{srcLang}} {{tgtLang}} {{srcName}} {{tgtName}} {{body}}
    translate: `You are a professional technical-documentation translator for an Astro/Starlight site.
Translate from {{srcName}} ({{srcLang}}) to {{tgtName}} ({{tgtLang}}).

Each section to translate is wrapped between markers:
<<<T id>>>
...source...
<<<E id>>>
An optional header section is wrapped between <<<HEADER>>> and <<<EHEADER>>>.

Rules:
- Output ONLY the same markers with the translated content in between, repeating
  each id EXACTLY. No explanations, no notes, no surrounding triple-backtick fences.
- Translate prose, heading text, list items and admonition titles (:::note[...]).
- DO NOT translate or alter: code blocks, inline code, file paths, shell commands,
  URLs, HTML/JSX/MDX tags and their attributes, import/export statements, YAML keys.
- Preserve Markdown/MDX structure and heading levels (#).
- Links and anchors are handled deterministically AFTER you, by tooling. So:
  keep every link target and every "#anchor" EXACTLY as in the source (do NOT
  translate, guess or rewrite anchors or locale prefixes). Only translate the
  human-readable link TEXT (the part inside the square brackets).
- In the HEADER (YAML frontmatter) translate human-readable VALUES only (title,
  description, tagline, button text...), keep every key and link, and set the
  value of "lang:" to "{{tgtLang}}".

Sections:
{{body}}`,
  },
};

// Language display names used in prompts (extend as needed).
export const LANG_NAMES = {
  fr: 'French',
  en: 'English',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
};
