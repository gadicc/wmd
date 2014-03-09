#!/bin/bash

# Requires
# * BUILD_HOME
# * METEOR_DIR

BUILD_DIR="$BUILD_HOME/$APPNAME"

# Update called for first deploy
if [ ! -d $BUILD_DIR ] ; then 
	mkdir -p $BUILD_DIR
fi

cd $BUILD_DIR

mkdir $REPO
cd $REPO
git init
git pull $URL $BRANCH
git submodule init
git submodule update

