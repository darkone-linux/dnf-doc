# Darkone framework documentation
# darkone@darkone.yt

_default:
	@just --list

# ── dev ──────────────────────────────────────────────────────────────────────

# Launch the dev environment
[group('dev')]
dev:
	@echo Launching dev environment...
	npm run dev

# Run translation scripts unit tests + internal link/anchor validation
[group('dev')]
test:
	node --test 'scripts/**/*.test.mjs'
	just check-links

# Validate internal #anchor links resolve to real headings (read-only)
[group('dev')]
check-links:
	node scripts/check-anchors.mjs

# Shares the framework's release script and git-cliff config, so every repo
# produces the same CHANGELOG from the same commit vocabulary.
#
# dnf-doc shares MAJOR.MINOR with the framework and owns only PATCH: `--line X.Y`
# jumps onto a new framework line, which `just release` at the workspace root
# passes automatically.

# Bump version, changelog and tag: just bump [auto|patch|minor|major|X.Y.Z]
[group('dev')]
bump level="auto" *args:
	bash ../dnf/just/scripts/bump.sh \
	    --config ../dnf/just/scripts/cliff.toml --level {{ level }} {{ args }}

# Preview the entry the next release would carry — writes nothing
[group('dev')]
changelog:
	@git-cliff --config ../dnf/just/scripts/cliff.toml --unreleased --bump 2>/dev/null

# Upgrade astro & starlight + dependencies
[group('dev')]
upgrade:
	@echo Full upgrade of doc dependencies...
	npx @astrojs/upgrade
	npm update
	npm upgrade

# ── update ───────────────────────────────────────────────────────────────────

# Codegen + changelog + tags/translate + clean/fix + build (+ link fixes) + deploy (skips deploy if no changes)
[group('update')]
update msg="":
	#!/usr/bin/env bash
	set -euo pipefail
	just codegen
	just update-changelog
	just translate
	just clean
	just build-fix
	if [ -n "$(git -C darkone-linux.github.io status --porcelain)" ]; then
	    just deploy "{{ msg }}"
	else
	    echo "Nothing changed — skipping deploy."
	fi

# Generate documentation from code (includes clean)
[group('update')]
codegen:
	@echo Generating documentation from source code...
	cd ../src/generator && cargo run --release --quiet -- doc --workdir ../..
	just clean
	@echo Done.

# An AI agent writes each new release's headline (CHANGELOG_MODEL); FR pages
# follow through `just translate`. Flags: --check (dry-run), --force.
# Changelog pages (EN) from the framework CHANGELOG.md, when it has new releases
[group('update')]
update-changelog *args:
	node scripts/update-changelog.mjs {{ args }}

# Clean markdown files (call fix: normalize whitespace, blank lines, tabs)
[group('update')]
clean:
	npm run clean

# Update translation tags (roles + main-file paragraph/header hashes)
[group('update')]
tags *args:
	node scripts/update-tags.mjs {{ args }}

# Incremental translation: update tags, then translate stale/missing paragraphs
# via AI agents. Flags: --check (dry-run), --force, --only=<path>.
[group('update')]
translate *args:
	node scripts/update-tags.mjs {{ args }}
	node scripts/translate.mjs {{ args }}

# Fix / improve code
[group('update')]
fix:
	@echo Fixing code...
	node ./scripts/fix.mjs

# Build the documentation
[group('update')]
build:
	#!/usr/bin/env bash
	set -euo pipefail
	echo Building...
	rm -rf dist
	if [ ! -d darkone-linux.github.io ]; then
	    git clone git@github.com:darkone-linux/darkone-linux.github.io.git
	fi
	if [ ! -f darkone-linux.github.io/.nojekyll ]; then
	    touch darkone-linux.github.io/.nojekyll
	fi
	npm run build
	rsync -rv --delete --exclude README.md --exclude .nojekyll --exclude .git dist/ darkone-linux.github.io/

# Build, repairing "invalid hash" links with an AI agent (max 3 rounds, model:
# FIXLINKS_MODEL, see scripts/translate.config.mjs). Flag: --check (dry-run).
[group('update')]
build-fix *args:
	node scripts/fix-build-links.mjs {{ args }}

# ── git ──────────────────────────────────────────────────────────────────────

# Deploy: pull + add + commit + push
[group('git')]
deploy msg="":
	#!/usr/bin/env bash
	MESG="{{ msg }}"
	if [ -z "$MESG" ]; then
		MESG=$(git log -1 --pretty=%B | head -n 1)
	fi
	if [ -z "$MESG" ]; then
	    echo "Error: no commit message found. Use: just deploy \"your message\""
	    exit 1
	fi

	# Unchanged site: skip the commit, `git commit` exits 1 and would stop
	# `just release` (dnf/just/codev/release.just).
	cd darkone-linux.github.io && \
	    git pull --rebase --autostash && \
	    git add . && \
	    { git diff --cached --quiet || git commit -m "$MESG"; } && \
	    git push -u origin main

# Pull built site from remote
[group('git')]
pull:
	cd darkone-linux.github.io && git pull --rebase

# Amend the current commit of built doc
[group('git')]
amend:
	#!/usr/bin/env bash
	cd darkone-linux.github.io && \
	    git add . && \
	    git commit --amend --no-edit && \
	    git push --force -u origin main

# Git status of built doc
[group('git')]
status:
	#!/usr/bin/env bash
	cd darkone-linux.github.io && git status

# Built doc git diff
[group('git')]
diff:
	#!/usr/bin/env bash
	cd darkone-linux.github.io && git diff
