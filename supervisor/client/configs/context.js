//import * as Collections from '/lib/collections';
var Collections = {};
import {Meteor} from 'meteor/meteor';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {ReactiveDict} from 'meteor/reactive-dict';
import {Tracker} from 'meteor/tracker';

/*
FlowRouter.wait();
Meteor.startup(() => {
  FlowRouter.initialize({hashbang: true});
});
*/

DefaultRouter = FlowRouter.group({
  triggersEnter: [
    function loginRedirects(context, redirect) {
      if (!Meteor.userId())
        redirect('/sign-in');
    }
  ]
});

export default function () {
  return {
    Meteor,
    FlowRouter,
    DefaultRouter,
    Collections,
    LocalState: new ReactiveDict(),
    Tracker
  };
}