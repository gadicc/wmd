import React, { Component } from 'react';
import AppList from '../components/appList.jsx';

let apps = [];

const Container = () => (
  <AppList apps={apps} />
);

export default Container;

