import React from 'react';

const AppList = ({apps}) => (
  <div>
    <div className="appList">{
      apps.map((p) => (
        <div key={p.id} className="app">
          <h2>{p.name}</h2>
        </div>
      ))
    }</div>
  </div>
);

export default AppList;
