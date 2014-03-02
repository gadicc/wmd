if (Meteor.isServer) {

	sha1 = Meteor.require('sha1');

	Files = {
		collection: new Meteor.Collection('files'),
		files: {},

		update: function(filename, contents, dest, hash, options) {
			var file = this.files[filename];
			if (!hash)
				hash = sha1(contents);
			if (!options)
				options = {};

			if (file) {
				if (file.hash == hash)
					return false;
				if (options.postAction)
					options.postAction.forceUpdate
						= new Date().getTime() + Math.random();
				this.collection.update(file.id, {
					$set: { contents: contents, hash: hash,
						postAction: options.postAction }
				});
				file.hash = hash;
				return true;
			}

			this.files[filename] = {
				hash: hash,
				id: this.collection.insert({
					filename: filename,
					hash: hash,
					contents: contents,
					dest: dest,
					postAction: options.postAction
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
				try {
					self.changed('files', doc._id, doc);
				} catch (err) {
					// [Error: Could not find element with id zJ5WK2ZqJmpTtX4Km to change]
					if (!err.toString().match(/Could not find element/))
						throw(err);

					// Wasn't sent down before because it was cached
					self.added('files', doc._id, doc);
				}
			}
		});
		self.ready();
		self.onStop(function() { handle.stop(); });
	});

}
