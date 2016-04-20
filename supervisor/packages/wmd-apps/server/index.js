import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import Task from 'meteor/gadicc:async-composable-tasks';

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const Apps = new Mongo.Collection('apps');

Apps.allow({
  insert() { return true },
  update() { return true },
  remove() { return true }
});

Meteor.publish('apps', () => Apps.find());

Meteor.methods({

  appStart: function(appId) {
    check(appId, String);

    var app = Apps.findOne(appId);

    if (['running', 'starting'].indexOf(app.state) !== -1)
      return;

    // if (someImpossibleTransition) return;

    const task = new Task(async (task) => {
      task.setStatus('Downloading docker image');
      task.updateProgress(0.2);
      await sleep(2000);
      task.setStatus('Creating container');
      task.updateProgress(0.4);
      await sleep(2000);
      task.setStatus('Launching container');
      task.updateProgress(0.6);
      await sleep(2000);
      task.setStatus('Waiting for app to be alive');
      task.updateProgress(0.8);
      await sleep(2000);
      task.setStatus('App launched successfully');
    });

    Apps.update(appId, { $set: {
      taskId: task._id,
      state: 'starting'
    }});

    task.run();
  },

  appStop: function(appId) {
    check(appId, String);

    var app = Apps.findOne(appId);

    if (['stopping', 'stopped'].indexOf(app.state) !== -1)
      return;

    // if (someImpossibleTransition) return;

    Apps.update(appId, { $set: { state: 'stopping' }});
  }

});