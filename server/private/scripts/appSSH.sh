#!/bin/bash

BUILD_DIR="$BUILD_HOME/$APPNAME"
USER="app$APPID"
FULLNAME="${APPNAME/:/;}"
APP_UID=$APPID

cd $BUILD_DIR

echo -e "$SSH_PRV" > identity
chmod 0600 identity

ssh  -i ./identity root@$SERVER <<_END_
if [ ! -d /home/$USER ] ; then
	echo
	echo "[Remote] Creating user and home directory"
	echo
	useradd $USER -u $APP_UID -s /bin/bash -m -d /home/$USER -c "$FULLNAME"
	passwd -l $USER # shouldn't be necessary, but just in case
fi
_END_

echo
echo "Syncing SSH"
echo

# requires rsync 3.1 on both side :(  --chown=$USER:$USER
rsync -avze 'ssh -i ./identity' --no-o $REPO root@$SERVER:/home/$USER/
RET=$?

ssh  -i ./identity root@$SERVER <<_END_
cd /home/$USER
find -uid 0 -print0 | xargs -0 chown $USER:$USER
_END_

rm identity

exit $RET

