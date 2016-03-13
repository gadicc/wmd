import React from 'react';

const IaasList = ({providers}) => (
  <div className="iaasList">
    <div className="iaasProviders">{
      providers.map((p) => (
        <div key={p.id} className="iaasProvider">
          <h2>{p.name}</h2>
        </div>
      ))
    }</div>
  </div>
);

export default IaasList;
