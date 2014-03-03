if (Meteor.isClient) {
	var handle = null;

	Router.map(function() {
		this.route('serverInfo', {
			path: 'servers/:server',
			waitOn: subAll,
			data: {}, 

				/* function() {
				// waitOn broken in shark branch, and data is not reactive
				return { serverParam: this.params.server }
				/*
				if (!subAll.ready())
					return;
				var server = Servers.findOne({
					$or: [
						{_id: this.params.server},
						{username: this.params.server}
					]
				});
				this.params.serverId = server._id;
				return {
					name: server.username,
					serverStats: ServerStats.findOne(server._id)
				}
				*/
			//},
			action: function() {
				console.log(1);
				if (!subAll.ready())
					return;
				console.log(2);
				console.log(this.params.server);
				var server = Servers.findOne({
					$or: [
						{_id: this.params.server},
						{username: this.params.server}
					]
				});
				Session.set('serverId', server._id);
				this.render();
			},
			after: function() {
				if (handle) handle.stop()
				var server = Servers.findOne({
					$or: [
						{_id: this.params.server},
						{username: this.params.server}
					]
				});
				if (!server) return;
				handle = ServerStats.find({_id: server._id}).observe({
					added: function(doc) {
					},
					changed: function(doc) {
						if (chart) {
							data.cpu.append(doc.lastUpdate.getTime(), doc.os.cpuUsage);
							data.mem.append(doc.lastUpdate.getTime(),
								(doc.os.totalmem - doc.os.freemem) / doc.os.totalmem);
						}
					}
				});

				this.render();
			}
		});
	});

	Template.serverInfo.helpers({
		'memUsage': function() {
			return 1 - this.freemem / this.totalmem;
		},
		'server': function() {
			return Servers.findOne(Session.get('serverId'));
		},
		'serverStats': function() {
			return ServerStats.findOne(Session.get('serverId'));
		},
		'cmd': function() {
			return this.cmd.replace(
				/\/home\/.*\/\.meteor\/tools\/[0-9a-f]+\//,
				'{meteorTools}/');
		},
		'userLink': function(user) {
			if (user == 'root')
				return user;
			var app = Apps.findOne({appId: parseInt(user.replace(/^app/, ''))});
			if (!app)
				return user;
			return '<a href="/apps/"' + app._id + '">'
				+ app.name + '</a>';
		},
		'procs': function() {
			var rootProcs = [];
			var procs = _.filter(this.procs, function(proc) {
				if (proc.user == 'root')
					rootProcs.push(proc);
				return proc.user != 'root'
					&& !(proc.pcpu == 0 && proc.pmem == 0);
			});
			procs = _.sortBy(procs, function(proc) { return proc.user; } );
			procs = _.union(rootProcs, procs);

			var orig = procs, lastUser = 'root';
			var totals = { pcpu: 0, pmem: 0 };
			procs = [];
			_.each(orig, function(proc) {
				if (proc.user != lastUser) {
					if (lastUser != 'root') {
						procs.push({
							user: 'total',
							pcpu: sprintf('%.1f', totals.pcpu),
							pmem: sprintf('%.1f', totals.pmem),
							cmd: ' '
						});
					}
					procs.push({user:'',cmd:''});
					lastUser = proc.user;
					totals.pcpu = proc.pcpu;
					totals.pmem = proc.pmem;
				} else {
					totals.pcpu += proc.pcpu;
					totals.pmem += proc.pmem;
				}
				procs.push(proc);
			});
			procs.push({
				user: 'total',
				pcpu: sprintf('%.1f', totals.pcpu),
				pmem: sprintf('%.1f', totals.pmem),
				cmd: ''
			});

			return procs;
		}
	});

	Template.serverInfo.events({
		'submit .sendCmd': function(event, tpl) {
			event.preventDefault();
			var form = $(event.target).closest('form');
			var serverId = form.data('server-id');
			var cmd = form.find('[name=cmd]').val();
			var returnEl = $('div.cmdReturn[data-server-id="' + serverId + '"]');
			try {
				var data = JSON.parse(form.find('[name=data]').val());
			} catch (error) {
				returnEl.html(error);
				return;
			}
			returnEl.html('Sending... ' + JSON.stringify({
				serverId:serverId, cmd:cmd, data:data
			}));
			Meteor.call('cmdTest', serverId, cmd, data, function(err, result) {
				if (err)
					returnEl.html(JSON.stringify(err, null, 4));
				else
					returnEl.html(JSON.stringify(result, null, 4));
			});
		}
	});

	var chart = null, data = null;
	Template.serverInfo.rendered = function() {
		var $canvas = $('#chart');
		if ($canvas.data('rendered'))
			return;
		$canvas.data('rendered', true);
		data = {
			cpu: new TimeSeries(),
			mem: new TimeSeries()
		};
		chart = new SmoothieChart({
			minValue: 0.0, maxValue: 1.0,
			millisPerPixel: 20,
			grid: { strokeStyle: '#555555', lineWidth: 1, millisPerLine: 1000, verticalSections: 10 },
			// timestampFormatter:SmoothieChart.timeFormatter
		});
		chart.addTimeSeries(data.mem, { strokeStyle: 'rgba(255, 255, 0, 1)', fillStyle: 'rgba(255, 255, 0, 0.2)', lineWidth: 4 });
		chart.addTimeSeries(data.cpu, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 4 });
		chart.streamTo($canvas[0], 1000 /* should be serve updateInterval */);
	};
}
