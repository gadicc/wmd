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

* Create new cloud servers on demand.  With Stats.
* Each Meteor process is run under forever-monitor, restarted
automatically, with logs & stats on the Web UI.
* Meteor is run directly, no bundling involved, for faster deploys.
* Deployments are via git deploys.  The local repo is updated (rdiff),
and then rsync is used to send just the changes to all relevant servers.

## Features (coming soon)

* Multitenancy
* Rules for when to spawn new servers, move Meteor to other servers, grow
servers, etc.  During a move, the old process stays up until the new one
is removed, for zero downtime.
* nginx and SSL management.

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

MIT for non-commercial use.  
  Commercial use within your own
company will be granted under an open source license,
however, you will explicitly not be licensed to take money from other people
through your use of this code (i.e. you may not use this code, or
any variations of this code, to operate a deployment service for others).

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

* **Why run in Meteor and send full source rather than bundling?**

Quicker redeploy times.  A bundle on our big project takes 27s
seconds to generate, and then still extract again (1s :)).  It's
true Meteor has to minify/compile everything on startup, but after
this, for redeploys, only changed files.  Overall that was much
quicker for us.
