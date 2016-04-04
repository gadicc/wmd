import React, { Component } from 'react';
import ServicesList from '../components/servicesList.jsx';
import { _ } from 'meteor/underscore';

const services = [];

const Container = () => (
  <ServicesList services={services} />
);

const baseService = {

};

const registerService = (service) => {
  if (!service.id)
    throw new Error('registerService called without id prop');
  if (!service.name)
    throw new Error('registerService called without name prop');

  services.push( _.extend({}, baseService, service) );
};

export { registerService, services };
export default Container;
