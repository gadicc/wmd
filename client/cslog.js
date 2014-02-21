// this file is just like server/logs/logs.js but uses ddp calls isntead
// of collection calls

var _ = require('underscore');
var shortid = require('shortid');

var cslog = function(ddpclient, title, data) {
	var self = this;
	self.ddpclient = ddpclient;
	self.localId = shortid.generate();  // TODO, better.

	if (!data) data = {};
	_.extend(data, {
		title: title,
		ctime: new Date(),
		remoteId: self.localId	// how it's stored on server
	});

	ddpclient.call('cslogs.new', [title, data], function(err, logId) {
		if (err) throw err;
		self.setLogId(logId);
	});
};

cslog.prototype.addLine = function(line) {
	var self=this;
	if (this.closed)
		throw new Error('slog.addLine on ' + this.logId +
			' but log already closed: ' + line);

	if (!_.isString(line))
		line = line.toString();

	if (this.logId) {
		this.ddpclient.call('cslogs.addLine', [this.logId, line],
			function(err, data) {
				if (err) throw err;
			});
	} else {
		// Callback to get logId hasn't come back yet, queue
		if (!this.queue)
			this.queue = [];
		this.queue.push(line);
	}

};

cslog.prototype.close = function(line) {
	var self = this;
	// Allow multiple close calls, useful for stream callbacks
	if (this.closed) return;

	if (this.logId) {
		this.closed = true;
		this.ddpclient.call('cslogs.close', [this.logId, line],
			function(err, data) {
				if (err) throw err;
			});
	} else
		this.queueClosed = line;
}

cslog.prototype.setLogId = function(logId) {
	this.logId = logId;
	if (this.queue) {
		this.addLine(this.queue.join(''));
		delete(this.queue)
	}
	if (this.queueClosed)
		this.close(this.queueClosed);
}

module.exports = cslog;
