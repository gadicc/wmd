import React from 'react';

const SourcesList = ({sources}) => (
  <div>
    <div className="sourcesList">{
      sources.map((p) => (
        <div key={p.id} className="source">
          <h2>{p.name}</h2>
          <p.Content />
        </div>
      ))
    }</div>
  </div>
);

export default SourcesList;
