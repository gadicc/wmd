import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

Apps = new Mongo.Collection('apps');

Apps.allow({
  insert() { return true },
  update() { return true },
  remove() { return true }
});


Meteor.publish('apps', () => Apps.find());
