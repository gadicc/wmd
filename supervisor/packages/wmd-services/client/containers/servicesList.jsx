import React, { Component } from 'react';
import ServicesList from '../components/servicesList.jsx';

let services = [];

const Container = () => (
  <ServicesList services={services} />
);

export default Container;

