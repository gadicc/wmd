#!/bin/bash

# Required vars:
# * APPID, e.g. 1001
# * APPNAME, e.g. meteor-app#master
# * USERCMD, e.g. git clone http://... 
# * REPO, e.g. meteor-app
# * BRANCH, e.g. master

APP_UID=$APPID
USER="app$APPID"
FULLNAME="${APPNAME/:/;}"

echo "$USER ($APP_UID): $FULLNAME"
if [ ! -d /home/$USER ] ; then
	echo "Creating home user and home directory"
	useradd $USER -u $APP_UID -s /bin/bash -m -d /home/$USER -c "$FULLNAME"
	passwd -l $USER # shouldn't be necessary, but just in case
fi

# TODO, remove, will log dangerous info (git token, etc)
export

# TODO, move github stuff elsewhere
cat > /home/$USER/appInstall.sh <<'__END__'
#!/bin/sh
# appInstall.sh REPO URL BRANCH
# We don't do this in one step to preserve OAUTH token secrecy
# https://github.com/blog/1270-easier-builds-and-deployments-using-git-over-https-and-oauth


# TODO, remove, will log dangerous info (git token, etc)
export


mkdir $1
cd $1
git init
git pull $2 $3
git submodule init
git submodule update
__END__
chmod a+x /home/$USER/appInstall.sh

cat > /home/$USER/appUpdate.sh <<'__END__'
#!/bin/sh
cd $REPO

# git pull $URL $BRANCH
# error: Your local changes to 'website/packages/.gitignore' would be overwritten by merge.  Aborting.

# so instead we do
echo fetch
git fetch $URL $BRANCH
echo reset
git reset --hard FETCH_HEAD
# git clean -df

git submodule update
__END__
chmod a+x /home/$USER/appUpdate.sh

su - $USER -c "./appInstall.sh $REPO $URL $BRANCH"
