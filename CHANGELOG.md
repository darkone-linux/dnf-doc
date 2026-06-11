# Changelog

All notable changes to dnf-doc are documented here.  
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.1.2] - 2026-06-11

### Added
- New(justfile): justfile admin page.

### Fixed
- Fix(update): check before deploy.
- Fix(translate): preserve MD & Astro tags.

### Changed
- Doc(matrix): init.
- Doc(services): update table + readme.
- Doc(modules): updates, removed Aim tags.
- Doc(alerts): alertmanager & monitoring updated.
- Doc(dev): prometheus alerting code map (lib/alerts.nix, rules pitfall).
- Doc(dev): generated overlays pattern + service require how-to.
- Doc(monitoring): alerts pages + prometheus/monitoring split, require.
- Doc(oidc): oidc + oauth2.

## [0.1.1] - 2026-06-07

### Added
- Improv(how-to): new orga + additions.
- Doc(dev): create a module.
- Reorganize: new hierarchy and rules.

### Fixed
- Fix(home): faq links.
- Doc(admin-guide): page VPN (workflow Headscale/Tailscale) + fix secrets.yaml.
- Fix(translate): anchor translation.
- Doc(refact): minor translate fix.
- Fix: translates.
- Fix: imports before translate tags.
- Fix(thanks): fr / en.
- Fix(links): corrections.

### Changed
- Doc(workstations): updates.
- Update(config): config.yaml doc + fixes.
- Improv(admin-guide): index avec sections auto (PageList dir=) + PageList amélioré.
- Doc(config): init.
- Doc(how-to): 3 sous-sections par persona + Sommaire auto (PageList) + suppr. page d'entrée.
- Translate: admin/dev pages -> en.
- Doc(dev): étoffe architecture/modules/generator/documentation + index en premier.
- Doc(admin): ajustements secrets/deploy/users + concepts Nix/NixOS.
- Doc(admin-guide): page SSO (Kanidm, OIDC, réplication WIP).
- Doc(admin-guide): page Services (activation + catalogue + portail).
- Doc(admin-guide): page Profils d'utilisateurs (héritage + tableau).
- Doc(admin-guide): page Profils d'hôtes (héritage + tableau).
- Doc(admin-guide): section Installer (poste/passerelle/HCS) + déplacements host-profiles & users.
- Doc(admin-guide): page Réseau (schémas + résolution DNS).
- Doc(admin-guide): page Concepts + corrige le chemin etc/config.yaml.
- Refact(admin-guide): sous-sections (comprendre/installer/exploiter/maintenir) + squelette des pages.
- Update(backup): fixes + manual save.
- Refact(all): files reorganisation.
- Refact(restic): hardened and simpler module + doc.
- Doc(service): internal ports rules.
- Doc(diagram): passwords / 2fa.
- Doc(dev): service init.
- Refact(services): serveral improvements.
- Feat(doc): short (title) for categories.
- Module(geneweb): enablePasswords option.
- Diagrams: d2 translate prompt & skill improved.
- Diagrams: d2 diagrams integration.
- Home: modules hierarchy.
- Translate: auto-file generation if not exists.
- Fixes: generator index title, default fr.
- Reorganize: refactorings.
- Spec: reorganise - revision.
- Spec: reorganise - first proposition.
- Deploy: modules ref separation.
- Doc(ref): reorganization + translate.
- Doc(ref): localize internal links in modules reference.

### Security
- Doc(admin): rédige operate (secrets/deploy/users) + maintain (security/monitoring/backup/troubleshooting).

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

[Unreleased]: https://github.com/darkone-linux/dnf-doc/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/darkone-linux/dnf-doc/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/darkone-linux/dnf-doc/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/darkone-linux/dnf-doc/compare/v0.0.2...v0.1.0
[0.0.2]: https://github.com/darkone-linux/dnf-doc/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/darkone-linux/dnf-doc/releases/tag/v0.0.1
