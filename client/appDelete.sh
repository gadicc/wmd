#!/bin/bash

# Required vars:
# * APPID, e.g. 1001

APP_UID=$APPID
USER="app$APPID"

# Server is meant to ensure app is stopped first, but just incase
PIDS=`ps -o pid= U $APPID`
if [ "$PIDS" != "" ] ; then
	echo "Warning, some processing still running, sending SIGTERM to:"
	ps $PIDS
	for pid in $PIDS ; do
		kill $pid
	done
	echo
	sleep 5;
	PIDS=`ps -o pid= U $APPID`
	if [ "$PIDS" != "" ] ; then
		echo "Still running, sending SIGKILL to:"
		echo $PIDS
		for pid in $PIDS ; do
			kill -9 $pid
		done
		echo
	fi
fi

echo "Deleting user and his home directory"
userdel -fr $USER
