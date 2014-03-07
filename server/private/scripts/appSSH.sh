#!/bin/bash

BUILD_DIR="$BUILD_HOME/$APPNAME"
USER="app$APPID"

cd $BUILD_DIR

echo -e "$SSH_PRV" > identity
chmod 0600 identity

rsync -avze 'ssh -i ./identity' $REPO root@$SERVER:/home/$USER/
RET=$?

rm identity

exit $RET

