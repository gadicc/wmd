//import * as Collections from '/lib/collections';
var Collections = {};
import {Meteor} from 'meteor/meteor';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {ReactiveDict} from 'meteor/reactive-dict';
import {Tracker} from 'meteor/tracker';
import {createStore} from 'redux';

/*
FlowRouter.wait();
Meteor.startup(() => {
  FlowRouter.initialize({hashbang: true});
});
*/

DefaultRouter = FlowRouter.group({
  /*
  triggersEnter: [
    function loginRedirects(context, redirect) {
      if (!Meteor.userId())
        redirect('/sign-in');
    }
  ],
  */
});

const Reducers = {

  _reducers: {},

  add: function(name, func) {
    Reducers._reducers[name] = func;
  },

  apply: function(state = {}, action) {
    const reducers = Reducers._reducers;
    for (let key in reducers)
      state = reducers[key](state, action);
    return state;
  }

}

const Store = createStore(Reducers.apply);

Reducers.add('route', (state, action) => {
  if (action.type === 'route')
    return {
      ...state,
      route: {
        name: action.name,
        params: action.params,
        queryParams: action.queryParams,
        path: action.path
      }
    }
  else
    return state;
});

var firstTime = true;
Tracker.autorun(function() {
  FlowRouter.watchPathChange();
  if (firstTime)
    return firstTime = false;

  // what about oldRoute?
  var { route, params, queryParams, path } = FlowRouter.current();
  Store.dispatch({ type: 'route', name: route.name, params, queryParams, path });
});

export default function () {
  return {
    Meteor,
    FlowRouter,
    DefaultRouter,
    Collections,
    LocalState: new ReactiveDict(),
    Tracker,
    Store,
    Reducers
  };
}
