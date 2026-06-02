# Changelog

All notable changes to dnf-doc are documented here.  
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.1.0] - 2026-06-02

### Added
- Update: first translate with new tool.

### Fixed
- Fix(tags): infer main lang from translated-from pointers.
- Fix: resolve remaining dead anchors; regenerate module-types list.
- Fix: correct unambiguous dead anchors and thanks link locale.
- Docs: fix dead module anchors in en/index via translate.
- Fix: --force now retranslates header and all paragraphs.
- Clean: Just clean + fix tests.

### Changed
- Just: clean before translate.
- Doc: specs directory.
- Just: reorganisation, improved update.
- Feat: deterministic anchor resolution and internal link validation.
- Feat: just translate — incremental agent translations.
- Services auto-update.

## [0.0.2] - 2026-05-26

### Fixed
- Added fix in justfile.
- Fix update / deploy targets.

### Changed
- Improved just bump with auto-changelog.
- Geneweb service.
- Node 22 -> 24.
- Harmonia nix binary cache service doc.
- AI tools HM module.
- Minor doc / comments fixes.
- Ignore fixes + no more AI.
- Agents files minor fixes.
- Testing module update.

## [0.0.1] - 2026-05-19

### Added
- Initial Astro/Starlight documentation site for Darkone NixOS Framework.
- Upgrade to Astro 6.

[Unreleased]: https://github.com/darkone-linux/dnf-doc/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/darkone-linux/dnf-doc/compare/v0.0.2...v0.1.0
[0.0.2]: https://github.com/darkone-linux/dnf-doc/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/darkone-linux/dnf-doc/releases/tag/v0.0.1
