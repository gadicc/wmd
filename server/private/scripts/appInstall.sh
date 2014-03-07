#!/bin/bash

export

BUILD_DIR="$BUILD_HOME/$APPNAME"
echo
echo Start
echo $BUILD_DIR
mkdir -p $BUILD_DIR
cd $BUILD_DIR


mkdir $REPO
cd $REPO
git init
git pull $URL $BRANCH
git submodule init
git submodule update


