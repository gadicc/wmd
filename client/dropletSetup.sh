#/bin/bash

# TODO, pass info from server
METEOR=`grep -E 'combo|meteor' credentials.json`
NGINX=`grep -E 'combo|nginx' credentials.json`
MONGO=`grep -E 'combo|mongo' credentials.json`

echo Adding EPEL...
rpm -Uvh http://download-i2.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm

## TODO, firewall, fail2ban

echo Setting up swap space...
fallocate -l 512M /swapfile
chmod 600 /swapfile
mkswap -f /swapfile
swapon /swapfile
echo "/swapfile	none	swap	defaults	0	0" >> /etc/fstab

echo
echo Adjusting swappiness and cfs_cache_pressure values...

sed '/vm\.swappiness/d' -ibak /etc/sysctl.conf
echo "vm.swappiness = 10" >> /etc/sysctl.conf
sysctl vm.swappiness=10

sed '/vm\.vfs_cache_pressure/d' -ibak /etc/sysctl.conf
echo "vm.vfs_cache_pressure = 50" >> /etc/sysctl.conf
sysctl vm.vfs_cache_pressure=50

echo
echo Installing rsync, wget, git...
yum install -y rsync wget git

echo
echo Installing nodejs and npm...
yum install -y nodejs --enablerepo=epel
yum install -y npm --enablerepo=epel

if [ $METEOR ] ; then
	echo
	echo Install Meteor install script
	mv launch-meteor.sh /usr/local/bin/meteor
	chmod a+x /usr/local/bin/meteor

	echo Installing meteorite...
	npm list -g meteorite | grep -q empty
	if [ $? -eq 0 ] ; then
		npm install -g meteorite
	else
		echo Already Intalled
	fi
fi

if [ $NGINX ] ; then
	echo
	echo Installing nginx...
	cat > /etc/yum.repos.d/nginx.repo <<'__END__'
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/centos/6/$basearch/
gpgcheck=0
enabled=1
__END__
	yum install -y nginx
	chkconfig nginx on
	service nginx start
fi

echo
echo Installing forver...
npm list -g forever | grep -q empty
if [ $? -eq 0 ] ; then
	npm install -g forever
else
	echo Already Intalled
fi

echo
echo "Setting up init script (/etc/init.d/wmd-client)..."
cat > /etc/init.d/wmd-client <<'__END__'
#!/bin/bash
# chkconfig: 2345 95 20
# description: Client connection to WMD server
# processname: wmd-client

# source function library
. /etc/rc.d/init.d/functions

RETVAL=0
prog="wmd-client"
lockfile=/var/lock/subsys/$prog

FOREVER=`which forever`
WMD_DIR=/root/wmd-client

LOGFILE=/var/log/forever.log
OUTFILE=/var/log/wmd-client.out
ERRFILE=/var/log/wmd-client.err
FOREVER_PATH=/var/run/forever
PID_FILE=/var/run/forever.pid
SCRIPT_PID=/var/run/wmd-status.pid
SCRIPT=wmd-client.js
MIN_UPTIME=10003
SPIN_SLEEP=5000

FOREVER_OPTS="start -l $LOGFILE -o $OUTFILE -e $ERRFILE \
   -p $FOREVER_PATH -a --pidFile=$SCRIPT_PID --sourceDir=$WMD_DIR \
   --minUptime=$MIN_UPTIME --spinSleepTime=$SPIN_SLEEP -d -v \
   $SCRIPT"

runlevel=$(set -- $(runlevel); eval "echo \$$#" )

start()
{
	echo -n $"Starting $prog: "
	$FOREVER $FOREVER_OPTS >& /dev/null
	RETVAL=$?
	PID=`ps ux | grep forever/bin/monitor | grep -v " grep " | awk '{print $2}'`
	if [ $RETVAL -eq 0 ] ; then
		touch $lockfile
		echo $PID > $PID_FILE
		success
	else
		failure
	fi
	echo
	return $RETVAL
}

stop()
{
	echo -n $"Stopping $prog: "
	# killproc -p $PID_FILE $FOREVER
	$FOREVER stop $SCRIPT >& /dev/null
	RETVAL=$?
	[ $RETVAL -eq 0 ] && rm -f $lockfile && success || failure
	echo
}

restart() {
	stop
	start
}

rh_status() {
	status -p $PID_FILE $prog
}

rh_status_q() {
	rh_status >/dev/null 2>&1
}

case "$1" in
	start)
		rh_status_q && exit 0
		start
		;;
	stop)
		if ! rh_status_q; then
			rm -f $lockfile
			exit 0
		fi
		stop
		;;
	restart)
		restart
		;;
	status)
		rh_status
		RETVAL=$?
		if [ $RETVAL -eq 3 -a -f $lockfile ] ; then
			RETVAL=2
		fi
		;;
	*)
		echo $"Usage: $0 {start|stop|restart|status}"
		RETVAL=2
esac
exit $RETVAL
__END__

chmod a+x *.sh
chmod a+x /etc/init.d/wmd-client
mkdir /var/run/forever
chkconfig --add wmd-client

echo
echo Installing dependencies for wmd-client.js...
npm install

echo
echo Starting wmd-client...
chmod a+x wmd-client.js
service wmd-client stop
service wmd-client start
