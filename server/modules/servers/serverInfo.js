if (Meteor.isClient) {
	Template.serverInfo.servers = function() {
		// don't ask :)  for force rerender of statCanvas
		return this.server ? Servers.find(this.server._id) : '';
	}
	Template.serverInfo.helpers({
		'memUsage': function() {
			return 1 - this.freemem / this.totalmem;
		},
		'cmd': function() {
			return this.cmd.replace(
				/\/home\/.*\/\.meteor\/tools\/[0-9a-f]+\//,
				'{meteorTools}/');
		},
		'serverStats': function() {
			return this.server ? ServerStats.findOne(this.server._id) : null;
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
		'_procs': function() {
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

	var statsObserve = null, chart = null, data = null;
	Template.statCanvas.rendered = function() {
		// Our "rendered" function (redrawn on serverId change)
		var $canvas = $('#chart');
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

		// console.log('Observing ' + this.data._id);

		if (statsObserve) statsObserve.stop()
		statsObserve = ServerStats.find(this.data._id).observe({
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
	};
}
