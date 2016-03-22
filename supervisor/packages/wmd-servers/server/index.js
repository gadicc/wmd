import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

const Servers = new Mongo.Collection('servers');

Meteor.publish('servers', () => {
  return Servers.find();
});

Servers.allow({
  insert: () => true,
  update: () => true,
  remove: () => true
});
