#!/bin/bash

BUILD_DIR="$BUILD_HOME/$APPNAME"
mkdir -p $BUILD_DIR
cd $BUILD_DIR

mkdir $REPO
cd $REPO
git init
git pull $URL $BRANCH
git submodule init
git submodule update
