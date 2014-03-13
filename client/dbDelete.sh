#!/bin/bash

# Required vars:
# * UID, e.g. 1001

USER="db$UID"

# Server is meant to ensure app is stopped first... but just in case
PIDS=`ps -o pid= U $UID`
if [ "$PIDS" != "" ] ; then
	echo Warning, processes still running... aborting
	ps $PIDS
	exit 1
fi

echo "Deleting user and his home directory"
userdel -fr $USER
