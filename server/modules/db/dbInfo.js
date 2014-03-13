mongoUrl = function(db) {
	var out = 'mongodb://' + db.meteorUser + ':' + db.meteorPassword + '@';
	_.each(db.instances.data, function(instance) {
		var server = Servers.findOne(instance.serverId);
		out += server.ip + ':' + db.port; //instance.port;
	});
	return out.substr(-1) == '@' ? null : out + '/meteor';
}

oplogUrl = function(db) {
	var out = 'mongodb://' + db.oplogUser + ':' + db.oplogPassword + '@';
	_.each(db.instances.data, function(instance) {
		var server = Servers.findOne(instance.serverId);
		out += server.ip + ':' + db.port; //instance.port;
	});
	return out.substr(-1) == '@' ? null : out + '/local?authSource=admin';
}

if (Meteor.isClient) {

	Template.dbInfo.mongo_url = mongoUrl;
	Template.dbInfo.oplog_url = oplogUrl;
	/*
	Template.dbInfo.db = function() {
		console.log(this);
		if (this.data && this.data.dbId)
			return Databases.findOne(this.data.dbId);
		else
			return null;

	}
	*/

}
