if (Meteor.isClient) {

  var layout;
	Router.configure({
	  layoutTemplate: 'layout',
	  loadingTemplate: 'loading',
	  waitOn: subAll,
    onBeforeAction: function(pause) {
      var current = this.layout();
      if (current != 'loginLayout')
        layout = current;
      if (!Meteor.user()) {
        this.layout('loginLayout');
        this.render('login');
        pause();
      } else
        this.layout(layout);
    }
	});

	Router.map(function() {
		this.route('home', {path: '/'});
	});

	Handlebars.registerHelper('sprintf', function(format, num, options) {
		if (options.hash.percent) num=num*100;
		return sprintf(format, num);
	});

	Accounts.ui.config({
		requestPermissions: {
			github: ['repo','admin:repo_hook']
		}
	});
}

if (Meteor.isServer) {
	var fs = Meteor.require('fs');

  Meteor.startup(function () {
    // code to run on server at startup
  });

  validServers = [];
  newServer = function(namePrefix, noPrefix, optional) {
  	// No other way to pass info to createUser and validateNewUser :)
  	var tmpUserName = (new Date().getTime() + Math.random()).toString();
  	validServers.push(tmpUserName);

  	var data = { username: tmpUserName, password: Random.id() };
  	var userId = Accounts.createUser(data);
  	validServers = _.without(validServers, tmpUserName);

  	var nid = incrementCounter('servers');
  	var name;
  	if (noPrefix) {
  		name = namePrefix;
	  	Meteor.users.update(userId, { $set: {
	  		username: name, nid: nid, server: true
	  	}});
  	} else {
	  	name = namePrefix + '-' + nid;
	  	data.username = name;
	  	Meteor.users.update(userId, { $set: {
	  		username: name, nid: nid, server: true
	  	}});
	}

  	ServerStats.insert({_id: userId, username: name, nid: nid });

  	data._id = userId;
  	data.nid = nid;
	data.createdAt = new Date();
  	_.extend(data, optional);
  	
  	Servers.insert(data);

	return data;
  }

  if (Servers.find().count() == 0) {
  	var password = newServer('devServer', true).password;
  	console.log('Creating "devServer" user with password "'+password+'".');
  	fs.writeFile('../../../../../../client/devserver.json', JSON.stringify({
  		username: 'devServer', password: password
  	})); // callbacks?
  }

  extRootUrl = function() {
	var url = Meteor.require('url');
	var rootUrl = url.parse(process.env.ROOT_URL);
	if (rootUrl.hostname == 'localhost' && config.get('dyndnsHost')) {
		rootUrl.hostname = config.get('dyndnsHost');
		rootUrl.host = rootUrl.host.replace(/localhost/, rootUrl.hostname);
		rootUrl.href = rootUrl.href.replace(/localhost/, rootUrl.hostname);
	}
	return rootUrl;
  }

  Meteor.methods({
  	'updateStats': function(os, procs) {
  		if (!this.userId)
  			return {};
  		ServerStats.update(this.userId, { $set: {
  			os: os,
  			procs: procs,
  			lastUpdate: new Date()
  		}});
  		return {};
  		// return { updateInterval: 1500 };
  	},

	  removeServer: function(id) {
	  	Meteor.users.remove(id);
	  	Servers.remove(id);
	  	ServerStats.remove(id);
	  }

  })
}
