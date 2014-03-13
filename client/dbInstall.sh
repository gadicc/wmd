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
	chown $USER:$USER /home/$USER/db

	echo
	echo "Starting intial mongo (noauth, localhost only)..."
	echo "Starting intial mongo (noauth, localhost only)..." 1>&3
	su - $USER -c "mongod --bind_ip 127.0.0.1 --nohttpinterface --port $PORT \
		--smallfiles --dbpath db --oplogSize 256 --replSet meteor" &

	sleep 2;
	echo
	echo "Setting up Replica Set"...
	echo "Setting up Replica Set"... 1>&3
	mongo --port $PORT <<__END__
use admin;
var rsconfig = {"_id":"meteor","members":[{"_id":0,"host":"127.0.0.1:$PORT"}]};
rs.initiate(rsconfig);
__END__

	echo "Waiting for replica set to initiate and become master..." 1>&3
	while [ "$IS_MASTER" != "true" ] ; do
		sleep 1
		echo
		echo "Waiting for replica set to initiate and become master..."
		IS_MASTER=`mongo --port $PORT --quiet --eval "print(rs.isMaster().ismaster)"`
	done

	echo
	echo "Show status and set up users..."
	echo
	mongo --port $PORT <<__END__
use admin;
rs.status();
db.isMaster();
db.addUser("$ADMIN_USER", "$ADMIN_PASSWORD");
db.addUser({user: "$OPLOG_USER", pwd: "$OPLOG_PASSWORD", roles: [], otherDBRoles: {local: ["read"]}})

use meteor
db.addUser("$METEOR_USER", "$METEOR_PASSWORD");
db.adminCommand({shutdown : 1, force : true});
exit
__END__

	sleep 2;
	echo
	echo "All set up!"
fi
