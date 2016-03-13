import React, { Component } from 'react';
import ServerList from '../components/serverList.jsx';

let servers = [];

const Container = () => (
  <ServerList servers={servers} />
);

export default Container;

