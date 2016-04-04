import React from 'react';
import AppBar from 'react-toolbox/lib/app_bar';
import { Button } from 'react-toolbox/lib/button';
import pure from 'recompose/pure';

const iconStyle = {
  height: '50%',
  position: 'relative',
  bottom: '-3px',
  marginRight: '10px'
};

const ServiceButtons = pure(function ServiceButtons({appId, services, actions, appServices}) {
  const disabled = {};
  if (appServices)
    appServices.forEach(service => disabled[service.id] = true);

  return ( <div>{
    services.map(service => (
      <Button key={service.id} raised disabled={disabled[service.id]}
          onClick={actions.addService.bind(null, appId, service)} >
        { service.icon ? <img src={service.icon} style={iconStyle} /> : null }
        { service.name }
      </Button>
    ))
  }</div> );
});

const ServiceAdds = pure(function ServiceAdds({appServices}) {
  return ( <div>{
    appServices ? appServices.map(service => (
      <div key={service.id}>{service.id}</div>
    )) : null
  }</div> );
});

const AppEdit = ({ app, actions, services, appsEditAddServices }) => (
  <div>
    <AppBar>
      <span style={{color:'white'}}>
        <Button mini onClick={actions.back}>
          <i className="material-icons md-36 md-light">arrow_back</i>
        </Button>
      </span>
      <h3>{app ? app.name : 'loading...'}</h3>
    </AppBar>

    <If condition={app}>

      <h3>App Settings</h3>

      <h3>Services</h3>

      <h3>Add Services</h3>

      <ServiceButtons appId={app._id} services={services} actions={actions}
        appServices={appsEditAddServices && appsEditAddServices[app._id]} />

      <ServiceAdds appServices={appsEditAddServices && appsEditAddServices[app._id]} />

    </If>
  </div>
);

AppEdit.propTypes = {
  app: React.PropTypes.oneOfType([ React.PropTypes.object, React.PropTypes.any ]),
  actions: React.PropTypes.object,
  services: React.PropTypes.array,
  appsEditAddServices: React.PropTypes.oneOfType([ React.PropTypes.object, React.PropTypes.any ])
};

export default AppEdit;
