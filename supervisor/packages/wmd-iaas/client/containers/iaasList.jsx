import React, { Component } from 'react';
import IaasList from '../components/iaasList.jsx';

let providers = [];
const addProvider = function(data) {
  providers.push(data);
}

const Container = () => (
  <IaasList providers={providers} />
);

export { addProvider };
export default Container;

