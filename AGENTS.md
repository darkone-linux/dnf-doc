# AGENTS.md

## Purpose

This is `dnf-doc`: the documentation site for the Darkone NixOS Framework (DNF),
built with [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/).
It is a standalone sub-repo (its own `.git`) nested inside a root project `../` at `doc/`.

## Commands

- `just dev`: start the Astro dev server (`npm run dev`)
- `just build`: build the static site into `dist/`
- `just clean`: normalize markdown whitespace/blank lines/tabs
- `just update "msg"`: codegen + build + deploy

## Layout

- `src/`: Astro/Starlight source (pages, components, content)
- `public/`: static assets
- `dist/`: build output (gitignored)
- `darkone-linux.github.io/`: cloned deployment target (gitignored)
- `scripts/`: build/deploy helpers
- `astro.config.mjs`: Astro configuration
