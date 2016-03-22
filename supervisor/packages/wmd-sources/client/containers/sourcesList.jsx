import React, { Component } from 'react';
import SourcesList from '../components/sourcesList.jsx';

let sources = [];
const addSource = (data) => sources.push(data);

const Container = () => (
  <SourcesList sources={sources} />
);

export { addSource };
export default Container;
