import React from 'react';

const ServerList = ({servers}) => (
  <div>
    <div className="serverList">{
      servers.map((p) => (
        <div key={p.id} className="server">
          <h2>{p.name}</h2>
        </div>
      ))
    }</div>
  </div>
);

export default ServerList;
