mongoUrl = function(db) {
	return 'mongodb://' + db.meteorUser + ':' + db.meteorPassword + '@'
		+ '188.226.177.118' + ':' + '6002/meteor';
}

oplogUrl = function(db) {
	return 'mongodb://' + db.oplogUser + ':' + db.oplogPassword + '@'
		+ '188.226.177.118' + ':' + '6002/local?authSource=admin';
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
