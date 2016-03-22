import React, { Component } from 'react';
import DockerList from '../components/dockerList.jsx';

let servers = [];

const Container = () => (
  <DockerList servers={servers} />
);

export default Container;

