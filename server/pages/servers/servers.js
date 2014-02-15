if (Meteor.isClient) {
	Router.map(function() {
		this.route('servers', {
			data: function() {
				return {
					servers: [
						{ name: 'Meteor Servers', servers: servers.find({type: 'meteor'}) }
					],
					iaasData: iaasData
				}
			}
		});
	});

	Template.servers.events({
		'submit #digitalocean': function(event, tpl) {
			event.preventDefault();
			Meteor.call('DO_new',
				$(tpl.find('#digitalocean [name="type"]')).val(),
				parseInt($(tpl.find('#digitalocean [name="regionId"]')).val()),
				parseInt($(tpl.find('#digitalocean [name="sizeId"]')).val())
			);
		},
		'click .destroy': function(event, tpl) {
			if (confirm('Are you sure?')) {
				var serverId = $(event.target).data('id');
				Meteor.call('DO_destroy', serverId, function(error, result) {
					if (error) alert(error);
				});
			}
		}
	});

	/*
	iaasData = {};
	ReactiveObjects.setProperties(iaasData, ['digitalocean']);

	Deps.autorun(function() {
		if (Meteor.user())
			Meteor.call('DO_refresh', function(error, data) {
				iaasData.digitalocean = data;
			});
	});
	*/
	iaasData = {"digitalocean":{"regions":[{"id":3,"name":"San Francisco 1","slug":"sfo1"},{"id":4,"name":"New York 2","slug":"nyc2"},{"id":5,"name":"Amsterdam 2","slug":"ams2"},{"id":6,"name":"Singapore 1","slug":"sgp1"}],"sizes":[{"id":66,"name":"512MB","slug":"m512mb","memory":512,"cpu":1,"disk":20,"cost_per_hour":0.00744,"cost_per_month":"5.0"},{"id":63,"name":"1GB","slug":"m1gb","memory":1024,"cpu":1,"disk":30,"cost_per_hour":0.01488,"cost_per_month":"10.0"},{"id":62,"name":"2GB","slug":"m2gb","memory":2048,"cpu":2,"disk":40,"cost_per_hour":0.02976,"cost_per_month":"20.0"},{"id":64,"name":"4GB","slug":"m4gb","memory":4096,"cpu":2,"disk":60,"cost_per_hour":0.05952,"cost_per_month":"40.0"},{"id":65,"name":"8GB","slug":"m8gb","memory":8192,"cpu":4,"disk":80,"cost_per_hour":0.11905,"cost_per_month":"80.0"},{"id":61,"name":"16GB","slug":"m16gb","memory":16384,"cpu":8,"disk":160,"cost_per_hour":0.2381,"cost_per_month":"160.0"},{"id":60,"name":"32GB","slug":"m32gb","memory":32768,"cpu":12,"disk":320,"cost_per_hour":0.47619,"cost_per_month":"320.0"},{"id":70,"name":"48GB","slug":"m48gb","memory":49152,"cpu":16,"disk":480,"cost_per_hour":0.71429,"cost_per_month":"480.0"},{"id":69,"name":"64GB","slug":"m64gb","memory":65536,"cpu":20,"disk":640,"cost_per_hour":0.95238,"cost_per_month":"640.0"},{"id":68,"name":"96GB","slug":"m96gb","memory":94208,"cpu":24,"disk":960,"cost_per_hour":1.42857,"cost_per_month":"960.0"}]}};
}

if (Meteor.isServer) {
	// used also in users.js
	DigitalOceanAPI = Meteor.require('digitalocean-api');
	iaasData = {"2kCuEFAJM6pbXsjZB":{"digitalocean":{"regions":[{"id":3,"name":"San Francisco 1","slug":"sfo1"},{"id":4,"name":"New York 2","slug":"nyc2"},{"id":5,"name":"Amsterdam 2","slug":"ams2"},{"id":6,"name":"Singapore 1","slug":"sgp1"}],"sizes":[{"id":66,"name":"512MB","slug":"m512mb","memory":512,"cpu":1,"disk":20,"cost_per_hour":0.00744,"cost_per_month":"5.0"},{"id":63,"name":"1GB","slug":"m1gb","memory":1024,"cpu":1,"disk":30,"cost_per_hour":0.01488,"cost_per_month":"10.0"},{"id":62,"name":"2GB","slug":"m2gb","memory":2048,"cpu":2,"disk":40,"cost_per_hour":0.02976,"cost_per_month":"20.0"},{"id":64,"name":"4GB","slug":"m4gb","memory":4096,"cpu":2,"disk":60,"cost_per_hour":0.05952,"cost_per_month":"40.0"},{"id":65,"name":"8GB","slug":"m8gb","memory":8192,"cpu":4,"disk":80,"cost_per_hour":0.11905,"cost_per_month":"80.0"},{"id":61,"name":"16GB","slug":"m16gb","memory":16384,"cpu":8,"disk":160,"cost_per_hour":0.2381,"cost_per_month":"160.0"},{"id":60,"name":"32GB","slug":"m32gb","memory":32768,"cpu":12,"disk":320,"cost_per_hour":0.47619,"cost_per_month":"320.0"},{"id":70,"name":"48GB","slug":"m48gb","memory":49152,"cpu":16,"disk":480,"cost_per_hour":0.71429,"cost_per_month":"480.0"},{"id":69,"name":"64GB","slug":"m64gb","memory":65536,"cpu":20,"disk":640,"cost_per_hour":0.95238,"cost_per_month":"640.0"},{"id":68,"name":"96GB","slug":"m96gb","memory":94208,"cpu":24,"disk":960,"cost_per_hour":1.42857,"cost_per_month":"960.0"}]}}};

	Meteor.methods({

		'DO_new': function(type, regionId, sizeId) {
			check(type, String);
			check(regionId, Number);
			check(sizeId, Number);

			var user = Meteor.users.findOne(this.userId);
			var creds = user.apis.digitalocean;
			var DO = new DigitalOceanAPI(creds.clientId, creds.apiKey);
			DO = Async.wrap(DO, ['dropletNew']);

			var iaas = iaasData[this.userId].digitalocean;
			var region = _.findWhere(iaas.regions, {id: regionId});
			var size = _.findWhere(iaas.sizes, {id: sizeId});

			var namePrefix = type+'-'+size.slug+'-'+region.slug;
			var imageId = 1646467; // CentOS 6.5 x64
			var optionals = {};

			var sshKeyIds = [];
			if (user.sshKey && user.sshKey.doId)
				sshKeyIds.push(user.sshKey.doId);
			if (user.apis.digitalocean.sshKeyId)
				sshKeyIds.push(user.apis.digitalocean.sshKeyId);
			if (sshKeyIds.length > 0)
				optionals.ssh_key_ids = sshKeyIds.join(',');

			var server = newServer(namePrefix, false, {
				type: type,
				requested: {
					region: region,
					size: size,
					imageId: imageId,
					optionals: optionals
				}
			});
			var droplet = DO.dropletNew(server.username,
				sizeId, imageId, regionId, optionals);

			servers.update(server._id, { $set: {
				digitalocean: droplet
			}});

			console.log(droplet);
		},

  	DO_refresh: function() {
			var user = Meteor.users.findOne(this.userId);
			var creds = user.apis.digitalocean;
	  	var DO = new DigitalOceanAPI(creds.clientId, creds.apiKey);
	  	DO = Async.wrap(DO, ['regionGetAll', 'sizeGetAll'])

	  	data = {
				regions: DO.regionGetAll(),
				sizes: DO.sizeGetAll()
	  	};

	  	iaasData[this.userId] = { digitalocean: data };
	  	return data;
		},

		DO_destroy: function(serverId) {
			var user = Meteor.users.findOne(this.userId);
			var creds = user.apis.digitalocean;
	  	var DO = new DigitalOceanAPI(creds.clientId, creds.apiKey);
	  	DO = Async.wrap(DO, ['dropletDestroy']);

			var server = servers.findOne(serverId);
			var dropletId = server.digitalocean.id;

			try {
				var result = DO.dropletDestroy(dropletId);
			} catch (error) {
				//console.log(error.toString());
				throw new Meteor.Error(404, error.toString());
			}
			// console.log(result);

			// only remove from database if successfully destroyed
			Meteor.users.remove(serverId);
			servers.remove(serverId);
			serverStats.remove(serverId);

			return result;
		}

	}); /* Meteor.methods */
} /* isServer */
