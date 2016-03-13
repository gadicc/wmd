import React from 'react';

const ServicesList = ({services}) => (
  <div>
    <div className="servicesList">{
      services.map((p) => (
        <div key={p.id} className="service">
          <h2>{p.name}</h2>
        </div>
      ))
    }</div>
  </div>
);

export default ServicesList;
