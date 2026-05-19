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

# Build + deploy
update: codegen build deploy

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
deploy:
	#!/usr/bin/env bash
	LAST_MESG=`git log -1 --pretty=%B | head -n 1`
	cd darkone-linux.github.io && \
	    git pull --rebase --autostash && \
	    git add . && \
	    git commit -m "$LAST_MESG" && \
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
	REPO="https://github.com/darkone-linux/dnf-doc"
	OLD=$(node -p "require('./package.json').version")
	npm version {{type}} --no-git-tag-version --no-commit-hooks > /dev/null
	NEW=$(node -p "require('./package.json').version")
	DATE=$(date +%Y-%m-%d)
	echo "Bumping $OLD → $NEW"
	# Insert new version section after [Unreleased]
	awk -v ver="$NEW" -v date="$DATE" \
	    '/^## \[Unreleased\]/{print; print ""; print "## [" ver "] - " date; next}1' \
	    CHANGELOG.md > CHANGELOG.tmp && mv CHANGELOG.tmp CHANGELOG.md
	# Update [Unreleased] comparison link
	sed -i "s|^\[Unreleased\]:.*|[Unreleased]: $REPO/compare/v$NEW...HEAD|" CHANGELOG.md
	# Insert new version link before [OLD] link (or append both if first bump)
	if grep -q "^\[$OLD\]:" CHANGELOG.md; then
	    sed -i "/^\[$OLD\]:/i [$NEW]: $REPO/compare/v$OLD...v$NEW" CHANGELOG.md
	else
	    printf '\n[%s]: %s/compare/v%s...v%s\n[%s]: %s/releases/tag/v%s\n' \
	        "$NEW" "$REPO" "$OLD" "$NEW" "$OLD" "$REPO" "$OLD" >> CHANGELOG.md
	fi
	git add package.json CHANGELOG.md
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
