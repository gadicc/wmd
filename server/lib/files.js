if (Meteor.isServer) {

	sha1 = Meteor.require('sha1');

	Files = {
		collection: new Meteor.Collection('files'),
		files: {},

		update: function(filename, contents, dest, hash, options) {
			var file = this.files[filename];
			if (!hash)
				hash = sha1(contents);

			if (file) {
				if (file.hash == hash) return false;
				this.collection.update(file.id, {
					$set: { contents: contents, hash: hash }
				});
				return true;
			}

			this.files[filename] = {
				hash: hash,
				id: this.collection.insert({
					filename: filename,
					hash: hash,
					contents: contents,
					dest: dest
				})
			};
			return true;
		}
	};

	Files.collection.find().forEach(function(doc) {
		Files.files[doc.filename] = {
			id: doc._id,
			hash: doc.hash
		}
	});

	Meteor.publish('files', function(existing) {
		var self = this;
		var handle = Files.collection.find().observe({
			added: function(doc) {
				if (!existing || existing[doc._id] !== doc.hash)
					self.added('files', doc._id, doc);
			}, changed: function(doc) {
				self.changed('files', doc._id, doc);
			}
		});
		self.ready();
		self.onStop(function() { handle.stop(); });
	});

}
