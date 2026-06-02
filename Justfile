# Darkone framework documentation
# darkone@darkone.yt

_default:
	@just --list

# Launch the dev environment
dev:
	@echo Launching dev environment...
	npm run dev

# Clean markdown files (normalize whitespace, blank lines, tabs)
clean:
	npm run clean

# Update translation tags (roles + main-file paragraph/header hashes)
tags *args:
	node scripts/update-tags.mjs {{ args }}

# Incremental translation: update tags, then translate stale/missing paragraphs
# via AI agents. Flags: --check (dry-run), --force, --only=<path>.
translate *args:
	node scripts/update-tags.mjs {{ args }}
	node scripts/translate.mjs {{ args }}

# Run the translation scripts unit tests
test:
	node --test 'scripts/**/*.test.mjs'

# Codegen + fix + build + deploy
update msg="": codegen fix build
	just deploy "{{ msg }}"

# Build the documentation
build:
	#!/usr/bin/env bash
	echo Building and deploying...
	rm -rf dist
	if [ ! -d darkone-linux.github.io ] ;then
		git clone git@github.com:darkone-linux/darkone-linux.github.io.git
	fi
	if [ ! -f darkone-linux.github.io/.nojekyll ] ;then
		touch darkone-linux.github.io/.nojekyll
	fi
	npm run build
	rsync -rv --delete --exclude README.md --exclude .nojekyll --exclude .git dist/ darkone-linux.github.io/

# Just pull built site from remote
pull:
	cd darkone-linux.github.io && git pull --rebase

# Deploy: pull + add + commit + push + GA deploy
deploy msg="":
	#!/usr/bin/env bash
	MESG="{{ msg }}"
	if [ -z "$MESG" ]; then
	    if [ -d "../dnf/.git" ]; then
	        MESG=$(git -C ../dnf log -1 --pretty=%B | head -n 1)
	    else
	        MESG=$(git log -1 --pretty=%B | head -n 1)
	    fi
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

# Amend the current commit of built doc
amend:
	#!/usr/bin/env bash
	cd darkone-linux.github.io && \
	    git add . && \
	    git commit --amend --no-edit && \
	    git push --force -u origin main

# Git status of built doc
status:
	#!/usr/bin/env bash
	cd darkone-linux.github.io && git status

# Built doc git diff
diff:
	#!/usr/bin/env bash
	cd darkone-linux.github.io && git diff

# Bump version and tag: just bump [patch|minor|major]
bump type="patch":
	#!/usr/bin/env bash
	set -euo pipefail
	OLD=$(node -p "require('./package.json').version")
	npm version {{type}} --no-git-tag-version --no-commit-hooks > /dev/null
	NEW=$(node -p "require('./package.json').version")
	echo "Bumping $OLD → $NEW"
	# Auto-generate changelog entry from git history
	node scripts/update-changelog.mjs --old "$OLD" --new "$NEW"
	git add package.json package-lock.json CHANGELOG.md
	git commit -m "Release v$NEW"
	git tag "v$NEW"
	echo "Done — run: git push && git push --tags"

# Upgrade astro & starlight + dependencies
upgrade:
	@echo Full upgrade of doc dependencies...
	npx @astrojs/upgrade
	npm update
	npm upgrade

# Generate documentation from code
codegen:
	@echo Generating documentation from source code...
	cd ../src/generator && cargo run --release --quiet -- doc --workdir ../..
	just clean
	@echo Done.

# Fix / improve code
fix:
	@echo Fixing code...
	node ./scripts/fix.mjs

