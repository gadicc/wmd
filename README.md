# Wastelands Meteor Deployer

"Deploy Meteor with Meteor".  A web interface to bring up new cloud
servers, handle deployments (via github), load-balance,
scale-on-demand, etc.  A work in progress.

Meant to handle private code.  You run your own WMP server for all
your own projects.  This is not intended to be cloud-hosted and offer
deployment services to others (which is against the license).
PLEASE READ "IMPORTANT NOTES", BELOW.

Copyright (c) 2014 Gadi Cohen, see license below.

## Features (implemented)

* Create new cloud servers on demand.  With realtime stats.
* Each Meteor process is run under forever-monitor, restarted
automatically, with realtime logs & stats on the Web UI.
* Meteor is run directly, no bundling involved, for faster deploys
& ultimate node compatibility (see FAQ).
* Deployments are via github (see FAQ), with auto update on
a git push.
* Nginx serves as a load balancer / reverse proxy in front of all
your Meteor instances, with integrated vhost and SSL management
via web UI.  Preconfigured for WebSockets and best caching policy
to minimize load on Meteor (cache policy coming soon).

## Features (coming soon)

* Multi-tenancy.  Spawn a bigger spec machine and put as many of
your apps on it as you want, pooling resources.  Move the apps to
their own / seperate servers only once the need arises.  Moving is
done with zero downtime.
* Rules for when to spawn new servers, move Meteor to other servers, grow
servers, etc.  During a move, the old process stays up until the new one
is removed, for zero downtime.
* Mongo management (with oplog, duh).  Support for multi-region databases.
* Automated mongo backups (schedule, before upgrade, etc)
* Extensions for e.g. email/sms/call if app goes down, etc.
* Use private-IPs if available.

## Quick start

```bash
$ git clone https://github.com/gadicohen/wmd.git
$ cd wmd/server
$ meteor
```

Open browser, (setup and) login with Github, and explore.

If you're behind a NAT, make sure your Meteor port is properly
forwarded, and, in JavaScript console, run `config.set('dyndnsHost', 'YOURHOST.dyndns.org')`;  It will be used as the hostname for ddp
connections from cloud servers if ROOT_URL contains `localhost`.

## IMPORTANT NOTES

NB: This is a work in progress.  You should only be using this in
development on your home PC.  Few security checks are in place.  Error
handling is limited.

Super NB: For anything important (i.e., nothing you should be doing
now), use with force-ssl.  Github OAuth tokens are sent over the wire
to your deployed servers.  Unless everything is over SSL, when you
finish playing, you should go to https://github.com/settings/applications,
select WMD, and click on 'Revoke all user tokens'.  (Your client
secret is ok).  OAuth tokens are not stored on any of your spawned
servers.

It's entirely possible I may abandon this project entirely once
Galaxy is launched.

DISCLAIMER: Use at your own risk.  You are giving the app full access
to your entire github codebase, and the ability to deploy new cloud
servers which will COST YOU MONEY.  By using this code you agree that
you understand, and take responsibility for, all risks.

LICENSE: [Ms-SS](http://directory.fsf.org/wiki/License:Ms-SS)
(for now :)).  Open source for non-commercial use.
To be clear, companies may use the code freely under the license,
they simply cannot charge for the use of the product, i.e. the
license probibits using the code, or modifications of the code,
to operate a paid deployment service for end-users.

## Preview Announcement

Web UI to deploy Meteor apps, including creation and setting up of
new cloud servers (on Digital Ocean), with realtime server and app
resource monitoring, and automatic app updates after a github push.

This is a total preview meant for development use; notably there is
not much security in place yet (anyone can login and modify your apps).
Although, when it is ready for production, it's kinda cool that you
can use the app to deploy itself (TODO, auto replicate database).

It started off as a project just for us internally, hence choice of
just Digital Ocean and github.  But later on in the project, I've
gradually started moving these things into seperate packages, so
it could be easy to extend to other Amazon and other IaaS, bitbucket,
etc.

A reminder: Digital Ocean servers are as little as $5/mo, but
billed per hour.  I spent less than $1 in total for all the time
needed to develop this app :)

## FAQ

* **Why just Digital Ocena and GitHub?**

WMD was developed internally for our own use, and this is what we
use.  However, later we decided to make the design more modular,
the above are now both individually packaged plugins, and it should
be able to make a plugin for almost anything (Amazon, BitBucket,
etc).

* **Why run in Meteor and send full source rather than bundling?**

Quicker redeploy times.  A bundle on our big project takes 27s
seconds to generate, and then still extract again (1s :)).  It's
true Meteor has to minify/compile everything on startup, but after
this, on redeploys, only for changed files.  Overall that was much,
much quicker for us (and no need to retransfer entire bundle).

Other advantages include the fact that we get Meteor's recommended
(and sometimes custom) node version, which can include patches
ahead of what's easily available / installable.

* **How are git deployments done?**

Currently, a git pull is run on every server.  Long term, we'd
prefer to git pull to the control server, and then in parallel,
rsync (over SSH) to all the servers.  Think (hypothetically)
200 servers in the same data center.  This should still remain
an option for the case where control server is on dev's home
PC, or servers are in multiple data centers.

* **How does wmd-client work and authenticate itself?**

When WMD creates a new server, it installs wmd-client on it.
There is no way to connect to the client, the client simply
repeatedly tries to open a DDP connection to wmd-server.
Servers are added as Meteor users; this allowed rapid
development by leveraging Meteor's SRP implementation and 
DDP authentication.  In the future, we want to add a
two-way authentication, situations where a fake server
could potentially hijack DNS (probably safer to use an IP),
or other methods.  Note, even though the client password
isn't sent in plaintext (thanks to SRP), plenty of sensitive
info is sent over the wire (like Github OAuth tokens); as
such, you server should be set up with SSL and force-ssl.

* **What happens if the controller (wmd-server) is down?**

All created servers are fully self functioning (and reboot
safe!).  Nginx will notice if a server/app is crashing and
remove it from the pool, but wmd-server won't notice this
and won't spawn new servers (or once resource limit flags
are reached according to rules).  Obviously, you won't be
able to manually start/stop apps, adjust vhost config, etc.

* **I think my database was compromised, what to do?**

1. Revoke all Github user keys [here](https://github.com/settings/applications).
1. Destroy all servers and dump the database (or give all servers new
passwords in both the database and on your servers, gen new SSH key
pair and replace in database and on all servers and on DigitalOcean
control panel).
1. Delete DigitalOcean OAuth pair on their Control Panel.
1. Revoke all SSL certificates (not that it's
[that effective](http://news.netcraft.com/archives/2013/05/13/how-certificate-revocation-doesnt-work-in-practice.html) and create new ones 
for all your domains.

In theory we could automate most of the above for this eventuality,
or have regular rotations for extra security, or something.


## Load testing Questions

https://github.com/alanning/meteor-load-test

1. How many concurrent users on each set of typical server specs?
Until significant speed loss, until melt down.
1. Algorithm for rough estimation of how many users per *x* servers,
with standard setup (load balancer, nginx for static assets, seperate
db servers, etc).
1. Automate testing of isolated differing approaches for same goal,
e.g. optimization of publications, etc.  CPU, time, etc.

## wmd.json (per app in root dir, all params optional.  TODO)

{
	name:
	meteorDir:
	instances: {
		min:
		max:
	}
}

## Relevant Digital Ocean "ideas" to vote for!

* [Deploy to physically seperated hardware](https://digitalocean.uservoice.com/forums/136585-digitalocean/suggestions/3859618-deploy-to-physically-separated-hardware) - so that if a DO server dies, it will take down
at most, one of your instances (currently 1,190 votes, marked as
"planned" for end of Q1 2014).

* [movable IP from VM to VM ("elastic IP")](https://digitalocean.uservoice.com/forums/136585-digitalocean/suggestions/2993170-movable-ip-from-vm-to-vm-elastic-ip-) - currently if your load balancer is down, all your sites
are down.  No way to have a secondary/backup (currently 834 votes,
marked as "planned")

* Private IPs are implemented [only in NYC2](https://www.digitalocean.com/blog_posts/introducing-private-networking) so far

## Differences between Galaxy / Meteor.Com

Galaxy is a commercially backed venture, maintained by the creators
of Meteor (i.e. the Meteor experts), which handles everthing
deployment related for you (so you don't have to), and has an SLA
guaranteeing uptime.

WMD is an open source developer tool maintained by the community.
It explicity offers no guarantees and has a very liberal disclaimer.
It involves more work, more responsibility, but if you're reading
this, you probably understand this and you have your reasons for
wanting to manage your own deployments.

Particularly, vs current non-Galaxy Meteor.com deploys, WMD lets
you have SSL on custom domains, and oplog support.  These issues
of course are addressed on Galaxy.

Reasons for wanting your own deployments could include:

* Security implications of hosting all your own infrastructure
* More flexibly resource management (VMs with high CPU/RAM just
for your app)
* More flexible software options -- you run your own servers and
can install native Linux software on them to be used by your app.
* Load balancing and stress testing.
* Data center placement, e.g. Europe vs USA, etc.