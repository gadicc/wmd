logs = new Meteor.Collection('logs');
logLines = new Meteor.Collection('logLines');

if (Meteor.isClient) {
	Router.map(function() {
		this.route('logs', {
			before: function() {
				this.subscribe('logs');
			},
			data: function() {
				return { logs: logs.find() }
			}
		});

		this.route('showLog', {
			path: '/logs/:logId',
			before: function() {
				this.subscribe('logs');
				this.subscribe('logLines', this.params.logId);
			},
			data: function() {
				return {
					log: logs.findOne(this.params.logId) // nonreactive
				}
			}
		});

		Template.showLog.lines = function() {
			return logLines.find();
		}
		Template.showLogLine.rendered = function() {
			var div = $('#showLog');
			div.scrollTop(div.prop('scrollHeight'));
		}
	});
}

if (Meteor.isServer) {
	Meteor.publish('logs', function() {
		return logs.find({}, {
			fields: { content: 0 },
			sort: { ctime: -1 },
			limit: 50
		});
	});
	Meteor.publish('logLines', function(logId) {
		return [
			logLines.find({i: logId}, {
				fields: { i: 0 }
			}),

			logs.find({_id: logId})
		];
	})

	slog = function(title, data) {
		if (!data) data = {};
		_.extend(data, {
			title: title,
			ctime: new Date()
		});
		this.logId = logs.insert(data);
	};

	slog.prototype.addLine = function(line) {
		if (!_.isString(line)) line = line.toString();
		logLines.insert({
			i: this.logId,
			l: line
		});
	};

	slog.prototype.close = function() {
		// Delay, since callbacks can run out of order
		Meteor.setTimeout(function() {
			console.log('actual close');
			this.closed = true;
			var lines = logLines.find({i: this.logId}).fetch();
			logs.update(this.logId, { $set: {
				content: _.pluck(lines, 'l').join('\n')
					+ '\nLog finished at ' + new Date().toString() + '\n'
			}});
			logLines.remove({i: this.logId});
		}, 8000);
	}

	/*
	var myLog = new slog('test');
	var i = 0;
	var interval = Meteor.setInterval(function() {
		if (++i == 20) {
			Meteor.clearInterval(interval);
			myLog.close();
			return;
		}
		myLog.addLine(new Date().toString());
	}, 500);
	*/
}
