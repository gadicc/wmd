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

const ServiceTypesList = ({serviceTypes}) => (
  <div>
    <div className="serviceTypesList">{
      serviceTypes.map((st) => (
        <div key={st.id} className="serviceType">
          <h2>ST: {st.name}</h2>
        </div>
      ))
    }</div>
  </div>
);

ServiceTypesList.propTypes = {
  serviceTypes: React.PropTypes.array
};

export default ServiceTypesList;
