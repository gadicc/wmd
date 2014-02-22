#!/bin/bash

# Required vars:
# * APPID, e.g. 1001
# * APPNAME, e.g. meteor-app#master
# * USERCMD, e.g. git clone http://... 
# * REPO, e.g. meteor-app

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
# appInstall.sh REPO URL
# We don't do this in one step to preserve OAUTH token secrecy
# https://github.com/blog/1270-easier-builds-and-deployments-using-git-over-https-and-oauth


# TODO, remove, will log dangerous info (git token, etc)
export


mkdir $1
cd $1
git init
git pull $2
__END__

chmod a+x /home/$USER/appInstall.sh

su - $USER -c "./appInstall.sh $REPO $URL"