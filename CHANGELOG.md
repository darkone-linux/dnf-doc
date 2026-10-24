# Changelog

All notable changes to dnf-doc are documented here.  
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.6.0] - 2026-10-24

### ⚠ Breaking

- **openclaw**: Clone projects into shared projectsDir, coding agents

### Added

- **remote-desktop**: Rd stop mode, host reason on arming failure
- **ai-space**: Opencode for members and the openclaw agent
- **microvm**: Hypervisor whisper.cpp server for guests' voice notes
- **openclaw**: Mutable config option, owner admin in the UI
- **openclaw**: Model catalog, subscriptions first, API keys, providers
- **openclaw**: Browser Talk with OpenAI GPT-Live, ChatGPT login first
- **openclaw**: Lobster workflows, automations declared in Nix
- **openclaw**: CliUsers run the host CLI, bare openclaw opens the TUI
- **headscale**: Policy alias for every declared zone host

### Fixed

- **microvm**: Hypervisor fully on networkd, static zone resolver
- **microvm**: No store optimise on a hypervisor, guest overlays go ESTALE
- **headscale**: Wait for a real 200 from the OIDC issuer before starting

### Documentation

- **releasing**: Installer test weekly, by hand or on a tag
- **releasing**: Installer scenarios swap disk modes, check the rotation
- **install**: Backup step skippable where no stick plugs in
- **install**: Wi-Fi wait on the ISO, dnf/ link kept by the GC
- **microvm**: MicroVM guests, ai-space profile, isolated hosts
- **space**: Space-init and space-sops, isolated hosts procedure
- **secrets**: No fleet default password, just passwd-default removed
- **profiles**: Ghostty, hidden icons, lighter admin profiles, network folder
- **install**: Local network folder and README of the new admin host
- **microvm**: Guest store gets a writable in-memory layer
- **microvm**: Guests answer ping and ssh, just enter works
- **space**: Kanidm group per AI space, proxy.spaceMembersOnly
- **space**: AI spaces page, OpenClaw service in the catalogue
- **space**: Provider login through the openclaw host command
- **space**: Light Linux accounts for AI space members
- **translate**: Ai spaces, release, onboarding
- **space**: Matrix bot of an AI space, just space-bot
- **space**: Matrix bot created by just space-init, only with a network Matrix
- **space**: Agent tooling of AI spaces, MCP, skills, workspace, voice notes
- **space**: Provider login by model, host CLI, gateway password migration
- **space**: Owner of an AI space, Matrix DMs with members only
- **space**: Declared identity of the assistant
- **sso**: Group changes apply within 15 minutes, forced sign-out URL
- **installer**: Just try, this tree in the installer VM
- **installer**: Optional package cache, store of the host for #try
- **microvm**: Guest state closed to the hypervisor's accounts
- **space**: Commands run without approval, members share one trust circle
- **space**: SSH key of the project clones, server key accepted once
- **space**: Monitoring-node in the space and guest examples
- **space**: Exec policy option, owner-only approvals, confined service
- **microvm**: Guest state mounted nosuid,nodev on the hypervisor
- **space**: MCP server secrets through secretEnv
- **translate**: Installer, ai spaces, microvm, sso, module reference -> en
- **installer**: Just try serves the store, the VM keeps the pin on relaunch
- **install**: Install-here cache arguments, darkone new --cache, no host tip
- **profiles**: Geeqie for every graphic profile, GIMP alone off admins
- **profiles**: Local network launchers under their French names
- **dns**: Service domain never a host name, PTR answers the host
- **microvm**: Hypervisor neither zone gateway nor NetworkManager host
- **dns**: Public names cached by AdGuardHome on the gateway
- **security**: C8 held by the zone resolvers, DoT/DoH upstream
- **translate**: Microvm, security, services, network
- **translate**: Remote desktop, justfile, service modules ref
- **umi**: Talon speech recognition asleep at start, enableSpeech option
- **network**: Network games now reach every zone and the tailnet
- **translate**: Openclaw options, accessibility, microvm, network, modules reference
- **vpn**: Reachable services, access removal, OIDC fallback trap
- **vpn**: Per-OS server setup and registration confirmation
- **translate**: Ai spaces, vpn, tailnet, connect device, module reference
- **vpn**: Drop the Tailscale DNS login callouts, keep a fallback row
- **user-guide**: Add games page
- **translate**: Vpn, connect-device, user-guide, games, sso

## [0.5.0] - 2026-10-17

### Added

- **gnome**: EnableGdmSelector option shows the GDM user list
- **gnome**: EnableGdmSelector option shows the GDM user list (en)
- **home**: Games/education excludePackages, umi dark theme by default
- **umi**: Tobii 5 defaults, head control on, headSpeed 5, gaze filter 1
- **umi**: Hover click defaults, 1.6 s delay and 30 px motion threshold
- **umi**: Single click once button, hover click pauses after one left click
- **umi**: EnableStkWithMouse, play SuperTuxKart with the mouse alone

### Fixed

- **umi**: Talon waits for the panel tray, Tobii screen size limit documented
- **monitoring**: FilesystemReadOnly ignores intended read-only mounts
- **umi**: STK journal lookup, joystick missing from lsusb

### Documentation

- **users**: Login keyring reset after just passwd
- **users**: Login keyring reset after just passwd (en)
- **services**: Registry read by the caddy and oauth2-proxy sub-modules
- **matrix**: Module anatomy after the sub-module split
- **translate**: Modules refactorings -> en
- **users**: .bkp file left in a home by Home Manager
- **profiles**: Per-account darkone.home overrides, no mkForce needed
- **profiles**: Element Desktop started for every profile with office tools
- **translate**: Home manager refactorings -> en
- **profiles**: Ghostty installs its terminfo on ssh hosts
- **profiles**: Ghostty installs its terminfo on ssh hosts (en)
- **umi**: Eye tracker calibration from a Cinnamon menu favorite
- **umi**: Head sensitivity and live pointer tuning from the Talon REPL
- **umi**: Rofi application grid, hiddenApps option, textScaling default
- **translate**: Umi adjustments -> en
- **umi**: Panel without Bluetooth icon nor corner bar
- **profiles**: Cartable Fantastique for the child profile
- **umi**: Maximized application windows, enableMaximize option
- **umi**: Passwordless keyring for the autologin user on every host
- **install**: Create the project with nix flake new -t, boilerplate sync
- **config**: Editor completion and validation via config.schema.json
- **install**: Generic installer ISO from the release, key via ssh-copy-id
- **profiles**: VS Code and Slidev on demand, migration
- **hosts**: No firmware on VMs, printer drivers opt-in with migration
- **install**: The admin machine is a DNF host, nix deploy account
- **dev**: Upstream module as a backport copy, not a fork input
- **secrets**: Bootstrap-keys, random nix password, restore the admin keys
- **install**: Install-here, local install of the admin host from the ISO
- **config**: The locale sets the console and desktop keyboard
- **install**: Assisted install with darkone new, scripted with --answers
- **install**: Encrypted first host with darkone new
- **install**: Admin key backup, assistant on tty1, welcome page
- **install**: Try DNF in a VM, installer test of the release train
- **translate**: Onboarding -> en
- **ref**: Regenerate for dnf v0.5.0

## [0.4.0] - 2026-10-05

### ⚠ Breaking

- **manage**: Just enter is port 22 only, just unlock takes the initrd prompt

### Added

- **build-fix**: AI repair of invalid link hashes in just update
- **changelog**: Just update-changelog, one page per release from the framework CHANGELOG
- **user**: SSH keys via authorized_keys registry and rbw agent
- **user**: SSH keys via authorized_keys registry and rbw agent (en)
- **home**: Rbw vault lock after 12h of inactivity
- **headscale**: Unbound view gives tagged nodes the LAN address of zone globals
- **umi**: Larger Cinnamon panel, icons and text, single-click Nemo
- **umi**: Eye tracker plugged in enables gaze control and hover click
- **umi**: Gaze panel with hover click types, pause zone and keyboard toggle
- **umi**: No terminal launcher, text scaling 1.4
- **umi**: Panel gaze switch, Talon action user.umi_gaze
- **umi**: Accessibility on from first login, no Onboard prompt
- **umi**: Onboard starts hidden, replaces its own autostart entry
- **umi**: Hide click type buttons while hover click is paused
- **umi**: Faster Talon gaze filters, head control and mouse jump off
- **umi**: Gaze button off pauses hover click, back on resumes it
- **umi**: Declarative Talon eye tracking modes (gaze, head, jumps, focus)

### Fixed

- **translate**: Re-point anchors after all writes, pair headings by paragraph hash
- **accounts**: Account creation review / improvements
- **accounts**: Emergency access FAQ and reset, dead anchors, typos
- **gdm**: Realign gdm-greeter UIDs with nixpkgs
- **umi**: No X forwarding through su on UMI hosts, prompts lock the screen
- **umi**: No mousetweaks in Cinnamon, click types, wheel and no hover popup

### Documentation

- **changelog**: Update
- **accounts**: Add onboarding paths, fix vault reset procedure
- **accounts**: Add onboarding paths, fix vault reset procedure (en)
- **release**: Recover a pushed tag whose GitHub release is missing
- **accounts**: Users page as Linux account reference, onboarding links to it
- **accounts**: Just invite in onboarding and reset
- **onboarding**: Refactorings translated (en)
- **vaultwarden**: /admin internal only, plain admin token
- **justfile**: Just invite command
- **vaultwarden**: Service comments
- **umi**: Users derived from profile, pinned session, keyring scope
- **umi**: UMI accounts on other hosts, input groups scope
- **umi**: Other accounts of a UMI host, drop gazeUsers FAQ
- **umi**: GNOME accounts keep GNOME defaults on a UMI host
- **umi**: Updates translated -> en
- **rbw**: Link to admin option
- **pandoc**: Moved pandoc to HM + md2pdf script
- **admin**: Move a host to another zone
- **network**: Strict DNS, tailnet names and dnf-locate for roaming hosts
- **network**: Strict DNS, tailnet names and dnf-locate for roaming hosts (en)
- **translate**: UMI, luks, vpn docs -> en
- **network**: AdGuard Home keeps no rate limit on the zone resolver
- **deploy**: Roaming feature, nomadic hosts build themselves
- **nextcloud**: Pin moves to 35, apps absent from the 35 release
- **nextcloud**: Smtp password from sops, occ run with sudo
- **translate**: Deployment fixes + nextcloud35 -> en

## [0.3.1] - 2026-09-25

### Added

- **gateway**: Backup links with health-checked failover
- **gateway**: Backup links with health-checked failover (en)
- **gateway**: Standby wifi backup radios until preferred links fail
- **gateway**: Uplinks back from an outage stay on probation until proven
- **gateway**: Carrier bounce puts an uplink on probation

### Fixed

- **just**: Deploy no longer fails when the built site is unchanged
- **alerts**: Keep SystemdUnitFailed firing 30m across oneshot retries

### Changed

- **engine**: Builders fetch locked flake sources from GitHub
- **engine**: Builders fetch locked flake sources from GitHub (en)

### Documentation

- **deploy**: AI code search, user journals and improvement suggestions
- **deploy**: AiContext applies to interactive runs too
- **deploy-alerts-gateway**: Translation en

## [0.3.0] - 2026-09-24

### ⚠ Breaking

- **machines**: Split usr/machines by provenance

### Added

- **install**: Detect wired NIC drivers into detected-hardware.nix

### Fixed

- **release**: Evaluate template hosts with stubbed hardware
- **smtp**: Network.smtp optional for mail-sending services
- **install**: Secrets, releasing, network install links & en

### Documentation

- **gnome**: Document gnome desktop defaults per profile
- **gnome**: Extensions icon hidden for non-technical profiles

## [0.2.1] - 2026-09-23

### Added

- **release**: Push the workspace root at the end of the train

### Fixed

- **release**: Skip flake check on templates without var/generated

### Documentation

- **ref**: Regenerate for dnf v0.2.2

## [0.2.0] - 2026-09-23

### Added

- **aarch64**: Added rpi02, rpi3
- **yubikey**: FIDO2 PIN enrollment for Kanidm passkeys
- **alerts**: Declarative silences + host labels
- **idm**: Move kanidm to 1.11, 1.10 reaches EOL on 2026-08-31
- **nextcloud**: Move to 34, upstream forbids skipping a major
- **nix-cache**: Split fetch priorities from build offloading
- **matrix**: Add the MatrixRTC backend for Element Call group calls
- **disks**: Ship smartmontools to admins, document disk commands
- **remote-desktop**: Attach to an open graphical session over RDP
- **remote-desktop**: Fall back to a GDM login screen when nobody is logged in
- **remote-desktop**: Document the explicit login mode
- **nextcloud**: Document how to reopen the sync settings
- **restic**: ListenAll + skip a run when the off-site server is down
- **alerts**: Probe peer gateways, a zone cannot report its own death
- **umi**: Move gaze profiles to framework, document accessibility
- **install**: Survive first reboot (2222, address probe, no suspend)
- **restic**: Never back up cloud sync folders, on every host
- **restic**: Exclude sources, local backups and bulky scratch dirs
- **matrix-admin**: Ketesa admin UI service
- **matrix**: Mandatory MAS and declarative network.matrix.admins
- **dev-guide**: Packages outside nixpkgs
- **gc**: Just gc with period/count argument
- **engine**: Readable report header, UTC start date and options
- **engine**: Name the deployed hosts in the report summary
- **engine**: Obey the action of a known error signature
- **nextcloud**: Plugins list update
- **engine**: Report what the AI repaired, document the service action
- **engine**: Say when a repair left the fleet on two revisions
- **release**: Idempotent ordered release train

### Fixed

- **links**: Home and dev-guide
- **mautrix**: Messenger bot reset
- **translate**: Table syntax preservation
- **translate**: Align services table anchors (en) with headings
- **cache**: Ncps -> nix-cache nginx
- **office**: Disable librewolf, insecure upstream (no maintainer)
- **user-guide**: Correct orthography, grammar and typography across user-guide pages
- **admin-guide**: Correct orthography in operate/matrix.mdx
- **astro**: Migrate markdown.rehypePlugins to markdown.processor unified API
- **links**: Broken links
- **restic**: Repo subpath is the category name, rest-server depth limit
- **alerts**: Watch kanidm.service, idm ServiceDown never fired
- **dns**: Gate nss-lookup on a resolver that answers, fix boot races
- **vpn**: Pin the headscale ip in hosts, breaks the dns boot cycle
- **translate**: Always take the preamble from the source file
- **boot**: Gate cert sync on a live tailnet, alert on restic socket
- **alerts**: Ignore remote and read-only-by-design mounts in fs rules
- **gateway**: Keep hostapd radios out of the networkd lan bridge
- **just**: Confirm the roaming address before targeting a host
- **yubikey**: Never let an untouched key block the LUKS boot
- **yubikey**: Let the passphrase prompt outlive the FIDO2 attempt
- **remote-desktop**: Scale the mirrored desktop into the client window
- **remote-desktop**: Disable the unit on stop, open at native resolution
- **nextcloud**: Document the tray menu, fix stale client option names
- **nextcloud**: The tray fix now lives in the GNOME module, not the unit
- **luks**: Unlock with the shared passphrase first, confirm it worked
- **install**: Scope roaming, unlock after the final reboot
- **luks**: Never ask the per-host passphrase during an install
- **install**: Refuse an address the host will not keep
- **yubikey**: Never strand a keyslot on an interrupted enrollment
- **translate**: Safety-net replace <-> with ↔ in translated prose
- **forgejo**: Serve SSH keys via AuthorizedKeysCommand
- **alerts**: One disk alert per partition, with its mountpoints
- **anssi**: Unblock the intermediary tier (R9, R12, R13, R14, R39, R79)
- **anssi**: Make R28, R32 and R67 bite, and stop C5 recommending ssh -J
- **prometheus**: Distinct host label on PeerGatewayDown rules
- **restic**: One alert per backup job, a failing one no longer masked
- **restic**: Watch freshness of hand-declared backup jobs too
- **restic**: Alert on never-successful jobs, drop stamps of removed jobs
- **alerts**: Render the report markdown as Matrix HTML
- **luks**: Ship virtio transports in initrd, audit NIC drivers

### Security

- **services**: Per-client NFS exports, Loki off LAN, scoped ports
- **ssh,keys**: Modules update
- **anssi**: Fix the faillock stack and keep hosts administrable

### Removed

- **yubikey**: Drop luks user presence option, hardware enforces it
- **gnome**: Drop dock notification badges and ghostty bell urgency

### Changed

- **matrix**: Double puppeting & links
- **all**: Replaced the — char
- **doc**: Several improvements
- **security**: Tables alignments
- **refact**: Minor + ->
- **cards**: Title & icons
- **cards**: Add Security and Matrix Messaging + icons (user-guide)
- **matrix**: Clearer bridges (callouts, official docs, login corrections)
- **services**: Expand each service entry (purpose, highlights, competitors, official docs)
- **grammar**: Update + grammar improvements
- **users**: Creation steps & pages

### Documentation

- **matrix**: Appservice token types and deterministic registrations
- **matrix**: Mute bridge bot troubleshooting procedure
- **security**: Corrige l'état des règles intermediary (R3/R5/C6, R67/R69/R70, hardenedUnits)
- **alerts**: Node selection, reach label and ZoneInternetDown
- **alerts**: Document smartctl, postfix and synapse exporters
- **sso**: Mark idempotent-script services in SSO status table
- **matrix**: Document configurable federation and friend signup
- **resilience**: Document oauth2-proxy startup gate and tailscale self-heal
- **tags**: Backfill translation tags on aarch64-hosts
- **services**: External zone access via HCS, drop protectExternalOnly
- **yubikey**: Strong authentication guide (pam, luks, kanidm, vaultwarden)
- Correct spelling and grammar in thanks.mdx and config.mdx
- **admin-guide**: Second autonomous deployer + harmonia cache
- **matrix**: Next-gen authentication (MAS), Element X and account portal
- **gateway**: Full-install command + tailnet registration
- **gateway**: Full-install command + tailnet registration
- **roaming**: Spec doc for roaming deployer
- **upgrade**: Backup commands, SQLite WAL trap on kanidm
- **services**: Drop cross-page anchor left verbatim by translation
- **matrix**: Minor comment fixes
- **matrix**: Split MAS and legacy auth, clarify friend registration
- **matrix**: Document SSO login failure modes under MAS
- **matrix**: Document QR-code login checks
- **matrix**: Note the mobile app follows the MAS mode
- **matrix**: Explain why the two call stacks cannot interoperate
- **matrix**: Update from sources
- **matrix**: Document localpart collisions between friends and SSO users
- **rename**: Add the host renaming how-to
- **admin**: Document the gateway TLS certificate sync unit
- **admin**: Explain which Loki receives the Caddy access logs
- **admin**: Warn that disabling sops removes account passwords
- **admin**: Document the eval-time validation of the arch field
- **admin**: Nfs-client must target the server zone
- **matrix**: Document relayed calls, STUN check and media port ranges
- **matrix**: Update livekit media port range to 30000-30100
- **dev-guide**: Document port ranges in the port registry
- **nextcloud**: Document the desktop client, SSO redirect and webdav
- **nextcloud**: Document the passwd-nextcloud secret generation recipe
- **nextcloud**: Switch webdav access to a GNOME online account
- **nextcloud**: Document client autostart ownership and reset pitfalls
- **secrets**: Configure-admin-host now generates all internal secrets
- **nextcloud**: Add a user page on webdav access and gnome sync
- **matrix**: Document call ringing troubleshooting and TURN peer policy
- **nextcloud**: Translate the user cloud page to English
- **ref**: Regenerate home module reference
- **install**: Follow the dnf/ symlink bootstrap and require a zone
- **nextcloud**: Tray icon is back, drop the settings launcher
- **rdp**: X11 troubleshooting rows for display, state and port
- **install**: Recover a run stranded by an address change
- **security**: Gateway filtering & SSH-per-role, terser comment rules
- **ssh**: Key-only SSH, declarative keys, SSH denial by group
- **secrets**: The default password records a reference, sets no account
- **nfs**: How-to for leaving the NFS home shares
- **release**: Versioning pages, bump on the shared release script
- **releasing**: Pending notes, first release and the push that closes the door
- **just**: Follow the dnf just/ layout; check-all is now check
- **just**: Reorganise the command reference by context
- **update**: Translate + fix links
- **modules**: New headscale options
- **update**: Headscale ACL migration #7
- **vpn**: Tailnet routing, DNS, MagicDNS, ACL and enrollment
- **update**: Translate + fix links
- **umi**: UMI -> Unified Multimodal Input + minor fixes
- **review**: Umi icon update + minor fixes
- **install**: ISO console shows IP and MAC before the prompt
- **qemu**: How-to for bridged test VMs with vm-start.sh
- **deploy**: Fleet-update recipe, module and config keys
- **release**: Dnf-fleet-update in the release train
- **fleet-update**: Update & fleet-update related docs
- **fleet-update**: Run flow, skip options and current limits
- **fleet-update**: --resume documented, plan and status refreshed
- **fleet-update**: Update & fleet-update related docs #2
- **fleet-update**: Improve deploy page form and add screenshot
- **fleet-update**: Matrix report, alert rooms and exit code 3
- **alerts**: Just send-msg and the fleet-update report
- **fleet-update**: Update & fleet-update related docs #3
- **fleet-update**: Update & fleet-update related docs #4
- **deploy**: Publication step, elected builders and auto-build
- **fleet-update**: Update & fleet-update related docs #5
- **fleet-update**: Update & fleet-update related docs #6
- **office**: Gnome contacts/calendar & plugins updates
- **ai**: Document the AI analysis, record an analysis-only scenario
- **fleet-update**: Fleet-update related docs (ai)
- **admin**: Document fleet update AI context
- **admin**: Document fleet update AI context (en)
- **ref**: Regenerate for dnf v0.2.1

### Dependencies

- update astro 6.3.5→7.0.5, starlight 0.39.2→0.41.2, sharp 0.32.5→0.35.3, starlight-links-validator 0.24.0→0.25.2; rm unused astro-embed
- update astro and starlight ecosystems

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

[Unreleased]: https://github.com/darkone-linux/dnf-doc/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/darkone-linux/dnf-doc/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/darkone-linux/dnf-doc/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/darkone-linux/dnf-doc/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/darkone-linux/dnf-doc/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/darkone-linux/dnf-doc/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/darkone-linux/dnf-doc/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/darkone-linux/dnf-doc/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/darkone-linux/dnf-doc/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/darkone-linux/dnf-doc/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/darkone-linux/dnf-doc/compare/v0.0.2...v0.1.0
[0.0.2]: https://github.com/darkone-linux/dnf-doc/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/darkone-linux/dnf-doc/releases/tag/v0.0.1
