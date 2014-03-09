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
	}
}

TaskStep = function(context) {
	_.extend(this, context);
}

// for intermediate status updates while status is still
// 'running', and before automatically being set to
// 'complete' or 'failed' depending on return or throw err
TaskStep.prototype.update = function(percent, desc) {
	console.log('update', arguments);
}

TaskStep.prototype.run = function(data, prevData, log) {
	return this.func.call(this, data, prevData, log);
}

/*
 var options = {
	manageLogs: 'global' (or true), 'steps', 'false' (default)
 }

 context = {
	alsoUpdateCollection: { 'Apps': app._id }
 }
*/
Task = function(slug, context) {
	var def = Tasks.defs[slug];
	if (!def)
		throw new Error('Tried to run non-existant task: "' + slug + '". '
			+ 'Define it first with Task.define()');
	this.slug = slug;
	this.options = def.options;
	this.steps = def.steps;
	this.stepData = []; // becomes 'steps' in collection
	
	this.total = this.steps.length;
	this.completed = 0;
	this.current = 0;

	var updateCol;
	if (context.alsoUpdateCollection)
		for (key in context.alsoUpdateCollection)
			updateCol = {
				col: root[key] || Collections[key],
				_id: context.alsoUpdateCollection[key]
			}
	else
		updateCol = false;

	this.id = Tasks.collection.insert({
		slug: this.slug,
		status: 'running',
		current: 0,
		total: this.total,
		completed: this.completed,
		steps: [],
		startedAt: new Date(),
		context: context,
		options: this.options
	});

	// make resumeable, safe logId and recreate if resumed
	this.log = this.options.manageLogs
		? new slog(slug + ' (task ' + this.id + ')') : null;
	Tasks.collection.update(this.id, { $set: { logId: this.log.logId }} );

	if (updateCol)
		updateCol.col.update(updateCol._id, { $set: { task: {
			slug: slug,
			total: this.total,
			completed: this.completed,
			logId: this.log.logId
		}}});

	var self = this;
	Fiber(function() {
		for (var i=0; i < self.steps.length; i++) {
			console.log('step ' + (i+1) + '/' + self.total);

			// data to be stored in DB; also part of instance context
			self.stepData[i] = {
				num: (i+1),
				status: 'running',
				startedAt: new Date(),
				doneData: {}				
			};

			var step = new TaskStep({
				desc: self.steps[i].desc,
				func: self.steps[i].func,
				data: self.stepData[i],
				task: self
			});

			self.current++;
			Tasks.collection.update(self.id, { $set: {
				current: self.current,
				currentDesc: step.desc
			}, $push: {
				steps: step.data
			}});

			if (updateCol)
				updateCol.col.update(updateCol._id, { $set: {
					'task.desc': step.desc
				}});

			try {

				var doneData = step.run(context,
					i > 0 ? self.stepData[i-1].doneData : undefined, self.log);

			} catch (err) {

				console.log(err);
				self.failing = true;
				step.data.status = 'failed';

				var update = {};
				step.data.status = update['steps.'+i+'.status'] = 'failed';
				self.currentDesc = update.currentDesc
					= step.data.error = update['steps.'+i+'.status'] = err.toString();
				self.status = update.status = 'failed';
				// stepData.doneData = update['steps.'+i+'.doneData'] = doneData;
				step.data.finishedAt = update['steps.'+i+'.finishedAt']
					= self.finishedAt = update.finishedAt = new Date();
				update.currentDesc = 'failed';
				Tasks.collection.update(self.id, {
					$set: update
				});
				self.log.close('FAILURE');
				if (updateCol)
					updateCol.col.update(updateCol._id, { $set: {
						'task.desc': 'TASK FAILED'
					}});
				break;

			}

			var update = {};
			step.data.status = update['steps.'+i+'.status'] = 'completed';
			self.stepData[i].doneData = update['steps.'+i+'.doneData'] = doneData;
			step.data.finishedAt = update['steps.'+i+'.finishedAt'] = new Date();
			self.completed++;

			if (self.completed == self.total) {
				console.log('completed ' + self.completed + ' total ' + self.total);
				self.finishedAt = update.finishedAt = new Date();
				self.status = update.status = 'completed';
				self.log.close('SUCCESS');
				if (updateCol)
					updateCol.col.update(updateCol._id, { $unset: { task: 1 }});
			} else {
				if (updateCol)
					updateCol.col.update(updateCol._id, { $set: {
						'task.completed': self.completed,
						'task.current': self.current
					}});
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
			this.update(0.5, 'bark');
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
