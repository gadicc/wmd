import React, { Component } from 'react';
import ServerList from '../components/serverList.jsx';
import actions from '../actions/serverList.js';
import { composeAll, composeWithTracker } from 'react-komposer';
import { Servers } from '../configs/context.js';

function composeHelpers(helpers) {
  var out = [];
  for (let helper in helpers)
    out.push(composeWithTracker(
      (props, onData) => {
        onData(null, { [helper]: helpers[helper](props) })
      }
    ));
  return out;
}

const Container = composeAll(
  ...composeHelpers({
    servers() {
      return Servers.find().fetch();
    },
    addServer() {
      return actions.addServer;
    }
  })
)(ServerList);

export default Container;

