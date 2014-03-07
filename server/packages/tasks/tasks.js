var Fiber = Npm.require('fibers');

Tasks = {

	collection: new Meteor.Collection('tasks'),
	defs: {},

	// [, options]
	define: function(slug, options, steps) {
		if (!steps) {
			steps = options;
			options = {};
		}
		if (!_.isArray(steps))
			steps = [steps];

		var def = {
			options: options,
			steps: steps
		}

		Tasks.defs[slug] = def;
	},

	// 'this' object in step functions
	stepMethods: {

		// for intermediate status updates while status is still
		// 'running', and before automatically being set to
		// 'complete' or 'failed' depending on return or throw err
		update: function(percent, desc) {

		}
	}

}

/*
 var options = {
	manageLogs: 'global', 'steps', 'false' (default)
	updateDoc: { collection: 'name', _id: 'id' }
 }
*/
Task = function(slug, context, options) {
	var def = Tasks.defs[slug];
	if (!def)
		throw new Error('Tried to run non-existant task: "' + slug + '"');
	this.slug = slug;
	this.options = def.options;
	this.steps = def.steps;
	this.stepData = []; // becomes 'steps' in collection
	
	this.total = this.steps.length;
	this.completed = 0;
	this.current = 0;

	this.id = Tasks.collection.insert({
		slug: this.slug,
		status: 'running',
		current: 0,
		total: this.total,
		completed: this.completed,
		steps: [],
		startedAt: new Date(),
		context: context,
		options: options
	});

	var self = this;
	Fiber(function() {
		for (var i=0; i < self.steps.length; i++) {
			console.log('step ' + (i+1) + '/' + self.total);
			var step = self.steps[i];
			var stepData = self.stepData[i] = {
				num: (i+1),
				status: 'running',
				doneData: {},
				startedAt: new Date()
			};

			self.current++;
			Tasks.collection.update(self.id, { $set: {
				current: self.current,
				currentDesc: step.desc
			}, $push: {
				steps: stepData
			}});

			try {

				var doneData = step.func(context,
					i > 0 ? self.stepData[i-1].doneData : undefined);

			} catch (err) {

				console.log(err);
				self.failing = true;
				stepData.status = 'failed';

				var update = {};
				stepData.status = update['steps.'+i+'.status'] = 'failed';
				self.currentDesc = update.currentDesc
					= stepData.error = update['steps.'+i+'.status'] = err.toString();
				self.status = update.status = 'failed';
				// stepData.doneData = update['steps.'+i+'.doneData'] = doneData;
				stepData.finishedAt = update['steps.'+i+'.finishedAt']
					= self.finishedAt = update.finishedAt = new Date();
				update.currentDesc = 'failed';
				Tasks.collection.update(self.id, {
					$set: update
				});
				break;

			}

			var update = {};
			stepData.status = update['steps.'+i+'.status'] = 'completed';
			stepData.doneData = update['steps.'+i+'.doneData'] = doneData;
			stepData.finishedAt = update['steps.'+i+'.finishedAt'] = new Date();
			self.completed++;
			if (self.completed == self.total) {
				self.completedAt = update.completedAt = new Date();
				self.status = update.status = 'completed';
			}
			update.currentDesc = 'completed';
			Tasks.collection.update(self.id, {
				$set: update,
				$inc: { completed: 1 }
			});
		}
	}).run();
}

/*
Tasks.define('moo', [
	{ 
		desc: 'moo1',
		func: function() { console.log('moo'); return {cowSaid:'moo1'}; }
	},
	{
		desc: 'moo2',
		func: function(context, data) {
			console.log('moo2');
			console.log(data);
			return {cowSaid:'moo2'};
		}
	}
]);
new Task('moo');
*/

Meteor.publish('tasks', function(currentTaskId) {
	return Tasks.collection.find({}, {
		sort: { createdAt: 1 }
	});
});
