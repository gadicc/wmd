# Wastelands Meteor Deployer

"Deploy Meteor with Meteor".  A web interface to bring up new cloud
servers, handle deployments (via github), load-balance,
scale-on-demand, etc.  A work in progress.

Meant to handle private code.  You run your own WMP server for all
your own projects.  This is not intended to be cloud-hosted and offer
deployment services to others (which is against the license, below).

On that note, I may well abandon this project once Galaxy is launched.

DISCLAIMER: Use at your own risk.  You are giving the app full access
to your entire github codebase, and the ability to deploy new cloud
servers which will COST YOU MONEY.  By using this code you agree that
you understand, and take responsibility for, all risks.

LICENSE: GPLv3, free for private use.  Commercial use can be discussed,
however, you are explicitly not licensed to take money from other people
through your use of this code (i.e. you may not use this code, or
any variations of this code, to operate a deployment service for others).

## Quick start

Clone the repo and run Meteor.
Open browser, login with Github, and explore.

## Features

* Create new cloud servers on demand.  Multitenancy.  With Stats.
* Each Meteor process is run under forever-monitor, stats on the Web UI.
* Meteor is run directly, no bundling involved, for faster deploys.
* Deployments are via git deploys.  The local repo is updated (rdiff),
and then rsync is used to send just the changes to all relevant servers.
* Rules for when to spawn new servers, move Meteor to other servers, grow
servers, etc.  During a move, the old process stays up until the new one
is removed, for zero downtime.
* nginx and SSL management.

Copyright (c) 2014 Gadi Cohen
