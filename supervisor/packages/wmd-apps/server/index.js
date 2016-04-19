import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

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

    Apps.update(appId, { $set: { state: 'starting' }});
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