if (Meteor.isClient) {
	Router.configure({
	  layoutTemplate: 'layout',
	  loadingTemplate: 'loading',
	  waitOn: subAll,
    after: function() {
      $('li.active').removeClass('active');
      $('a[href="'+this.path+'"]').parent().addClass('active');
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

  newServer = function(namePrefix, noPrefix, optional) {
  	var data = { username: namePrefix, password: Random.id() };
  	var userId = Accounts.createUser(data);
  	var nid = incrementCounter('servers');
  	var name;
  	if (noPrefix) {
  		name = namePrefix;
  	} else {
	  	name = namePrefix + '-' + nid;
	  	data.username = name;
	  	Meteor.users.update(userId, { $set: {
	  		username: name, server: true, nid: nid
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
