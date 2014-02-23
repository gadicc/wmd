logs = new Meteor.Collection('logs');
logLines = new Meteor.Collection('logLines');

if (Meteor.isClient) {
	Router.map(function() {
		this.route('logs', {
			before: function() {
				this.subscribe('logs');
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

		Template.logs.logs = function() {
			return logs.find();
		}

		Template.showLog.lines = function() {
			return logLines.find();
		}

		var htmlEntities = function(str) {
    		return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

		Template.showLogLine.ansi2html = function(line) {
			return ansi2html.toHtml(htmlEntities(line));
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
			logs.find({_id: logId}),

			logLines.find({i: logId}, {
				fields: { i: 0, c: 0 }
			})
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
		if (this.closed)
			throw new Error('slog.addLine on ' + this.logId +
				' but log already closed: ' + line);

		if (!_.isString(line)) line = line.toString();
		logLines.insert({
			//c: incrementCounter('log'+this.logId),
			c: new Date().getTime(),
			i: this.logId,
			l: line
		});
	};

	slog.prototype.close = function(line) {
		// Allow multiple close calls, useful for stream callbacks
		if (this.closed) return;

		this.closed = true;
		var lines = logLines.find({i: this.logId},
			{ sort: { c: 1 } }).fetch();
		logs.update(this.logId, { $set: {
			content: _.pluck(lines, 'l').join('')
				+ '\n' + (line ? (line + '\n') : '')
				+ 'Log finished at ' + new Date().toString() + '\n'
		}});
		logLines.remove({i: this.logId});
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

	// TODO, check source, contents, etc before insert
	Meteor.methods({
		'cslogs.new': function(title, data) {
			data.fromServer = this.userId;
			var logId = logs.insert(data);
			console.log('New remote log: ' + logId, data);
			return logId;
		},
		'cslogs.addLine': function(logId, line) {
			logLines.insert({
				//c: incrementCounter('log'+this.logId),
				c: new Date().getTime(),
				i: logId,
				l: line
			});
		},
		'cslogs.close': function(logId, line) {
			var lines = logLines.find({i: logId},
				{ sort: { c: 1 } }).fetch();
			logs.update(logId, { $set: {
				content: _.pluck(lines, 'l').join('')
					+ '\n' + (line ? (line + '\n') : '')
					+ 'Log finished at ' + new Date().toString() + '\n'
			}});
			logLines.remove({i: logId});
		}		
	});
}
