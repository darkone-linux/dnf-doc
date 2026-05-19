# Darkone NixOS Framework Documentation

Documentation site for the
[Darkone NixOS Framework](https://github.com/darkone-linux/darkone-nixos-framework),
built with [Astro](https://astro.build/) and
[Starlight](https://starlight.astro.build/).

Published at: <https://darkone-linux.github.io>

## Stack

- **Astro 5** + **Starlight** — static site generator with docs theme
- Bilingual: English (`en`) and French (`fr`)
- Part of module reference auto-generated from `src/generator` (`just codegen`)

## Development

```sh
just dev        # start dev server (npm run dev)
just build      # production build → dist/
just update     # codegen + build + deploy
just upgrade    # upgrade Astro, Starlight and all npm deps
```

Requires Node.js. Install dependencies once with `npm install`.

## Deployment

The site is deployed to GitHub Pages via the
`darkone-linux/darkone-linux.github.io` repo cloned as a sibling directory.
`just deploy` pulls, commits the new build, and pushes.

## Content

```
src/content/docs/
  en/
    doc/          Introduction, specifications, user guide, admin guide, how-to
    ref/          Module reference (partly auto-generated)
    changelog/    Release notes
  fr/             French translations (mirrors en/ structure)
src/assets/       Images and diagrams
src/plugins/      Custom rehype/remark plugins
```

To regenerate the module reference from source:

```sh
just codegen    # runs: cd ../src/generator && cargo run --release -- doc
```
