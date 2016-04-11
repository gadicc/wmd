import React from 'react';
import ServicesListTypes from '../components/servicesList.jsx';
import { _ } from 'meteor/underscore';

const serviceTypes = {};

const Container = () => (
  <ServicesListTypes serviceTypes={serviceTypes} />
);

const baseServiceType = {

};

const registerServiceType = (serviceType) => {
  if (!serviceType.id)
    throw new Error('registerServiceType called without id prop');
  if (!serviceType.name)
    throw new Error('registerServiceType called without name prop');

  serviceTypes[serviceType.id] = _.extend({}, baseServiceType, serviceType);
};


export { registerServiceType, serviceTypes };
export default Container;
