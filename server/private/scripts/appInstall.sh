#!/bin/bash

# Requires
# * BUILD_HOME
# * METEOR_DIR
# * REPO

BUILD_DIR="$BUILD_HOME/$APPNAME"

# Update called for first deploy
if [ ! -d $BUILD_DIR ] ; then 
	mkdir -p $BUILD_DIR/$REPO
fi
cd $BUILD_DIR/$REPO

if [ -d .git ] ; then
	# Regular update
	git fetch $URL $BRANCH
	git reset --hard FETCH_HEAD
	# git clean -df

	git submodule init
	git submodule update
else
	# First deploy
	git init
	git pull $URL $BRANCH
	git submodule init
	git submodule update

	cat > $METEOR_DIR/wmdInit.js <<_END_
	if (Meteor.isServer)
		Meteor.startup(function() {
			Npm.require('fs').writeFile('lastStart', new Date().getTime());
		});
_END_
fi
