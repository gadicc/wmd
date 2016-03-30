import React from 'react';
import MongoStream from 'meteor/gadicc:mongo-stream';

const ServerList = ({servers}) => (
  <div>
    <h2>Servers</h2>
    <MongoStream id="a" />
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
