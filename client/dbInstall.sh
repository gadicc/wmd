#!/bin/bash

# Required vars:
# * UID, e.g. 1001
# * PORT

USER="db$UID"
FULLNAME="Database #$UID"
# FULLNAME="${APPNAME/:/;}"

echo "$USER ($UID): $FULLNAME"
if [ ! -d /home/$USER ] ; then
	echo "Creating home user and home directory"
	useradd $USER -u $UID -s /bin/bash -m -d /home/$USER -c "$FULLNAME"
	passwd -l $USER # shouldn't be necessary, but just in case
	mkdir /home/$USER/db

	mongod --fork --bind 127.0.0.1 --nohttpinterface --port $PORT \
		--smallfiles --dbpath db --oplogSize 256 --replSet meteor
	sleep 2;
	mongo --port $PORT <<__END__
use admin

var rsconfig = {"_id":"meteor","members":[{"_id":0,"host":"127.0.0.1:$PORT"}]}
rs.initiate(rsconfig);

db.addUser("$ADMIN_USER", "$ADMIN_PASSWORD");
db.addUser({user: "$OPLOG_USER", pwd: "$OPLOG_PASSWORD", roles: [], otherDBRoles: {local: ["read"]}})

use meteor
db.addUser("$METEOR_USER", "$METEOR_PASSWORD");
db.adminCommand({shutdown : 1, force : true});
__END__
fi
