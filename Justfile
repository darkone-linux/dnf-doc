# Darkone framework documentation
# darkone@darkone.yt

_default:
	@just --list

dev:
	@echo Launching dev environment...
	npm run dev

deploy:
	#!/usr/bin/env bash
	echo Building and deploying...
	rm -rf dist
	npm run build
	rsync -rv --delete --exclude README.md dist/* darkone-linux.github.io/
	LAST_MESG=`git log -1 --pretty=%B | head -n 1`
#	cd darkone-linux.github.io && \
#	    git pull && \
#	    git add . && \
#	    git commit -m "$LAST_MESG" && \
#	    git push -u origin main

upgrade:
	@echo Full upgrade of doc dependencies...
	npx @astrojs/upgrade
	npm update
	npm upgrade

