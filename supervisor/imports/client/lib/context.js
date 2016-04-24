//import * as Collections from '/lib/collections';
var Collections = {};
import {Meteor} from 'meteor/meteor';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {ReactiveDict} from 'meteor/reactive-dict';
import {Tracker} from 'meteor/tracker';
import {createStore} from 'redux';
import {reducer as formReducer} from 'redux-form';

/*
FlowRouter.wait();
Meteor.startup(() => {
  FlowRouter.initialize({hashbang: true});
});
*/

const DefaultRouter = FlowRouter.group({
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

Reducers.add('form', (state, action) => {
  var form = formReducer(state.form, action);
  return {
    ...state,
    form
  }
});

const Store = createStore(Reducers.apply, {},
  window.devToolsExtension ? window.devToolsExtension() : undefined);

var firstTime = true;
Tracker.autorun(function() {
  FlowRouter.watchPathChange();
  if (firstTime)
    return firstTime = false;

  // what about oldRoute?
  var { route, params, queryParams, path } = FlowRouter.current();
  Store.dispatch({ type: 'route', name: route.name, params, queryParams, path });
});

const LocalState = new ReactiveDict();

export {
  Collections,
  DefaultRouter,
  FlowRouter,
  LocalState,
  Meteor,
  Reducers,
  Store,
  Tracker
};

export default {
  Collections,
  DefaultRouter,
  FlowRouter,
  LocalState,
  Meteor,
  Reducers,
  Store,
  Tracker
};
