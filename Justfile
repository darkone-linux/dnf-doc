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

# Bump version and tag: just bump [patch|minor|major]
[group('dev')]
bump type="patch":
	#!/usr/bin/env bash
	set -euo pipefail
	OLD=$(node -p "require('./package.json').version")
	npm version {{type}} --no-git-tag-version --no-commit-hooks > /dev/null
	NEW=$(node -p "require('./package.json').version")
	echo "Bumping $OLD → $NEW"
	node scripts/update-changelog.mjs --old "$OLD" --new "$NEW"
	git add package.json package-lock.json CHANGELOG.md
	git commit -m "Release v$NEW"
	git tag "v$NEW"
	echo "Done — run: git push && git push --tags"

# Upgrade astro & starlight + dependencies
[group('dev')]
upgrade:
	@echo Full upgrade of doc dependencies...
	npx @astrojs/upgrade
	npm update
	npm upgrade

# ── update ───────────────────────────────────────────────────────────────────

# Codegen + tags/translate + clean/fix + build + deploy (skips build/deploy if no changes)
[group('update')]
update msg="":
	#!/usr/bin/env bash
	set -euo pipefail
	just codegen
	just translate
	just clean
	just build
	if [ -n "$(git status --porcelain)" ]; then
	    just deploy "{{ msg }}"
	else
	    echo "Nothing changed — skipping build and deploy."
	fi

# Generate documentation from code (includes clean)
[group('update')]
codegen:
	@echo Generating documentation from source code...
	cd ../src/generator && cargo run --release --quiet -- doc --workdir ../..
	just clean
	@echo Done.

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
	cd darkone-linux.github.io && \
	    git pull --rebase --autostash && \
	    git add . && \
	    git commit -m "$MESG" && \
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
