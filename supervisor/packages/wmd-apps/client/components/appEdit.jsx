import React from 'react';
import AppBar from 'react-toolbox/lib/app_bar';
import { Button } from 'react-toolbox/lib/button';
import pure from 'recompose/pure';
import {reduxForm} from 'redux-form';

const iconStyle = {
  height: '50%',
  position: 'relative',
  bottom: '-3px',
  marginRight: '10px'
};

const ServiceButtons = pure(function ServiceButtons({appId, services, actions, appServices}) {
  const disabled = {};
  if (appServices)
    appServices.forEach(serviceId => disabled[serviceId] = true);

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

const ServiceAdds = pure(function ServiceAdds({appId, appServices, services}) {
  if (!appServices)
    return null;

  return (
    <div id="x">
      {
        appServices.map(serviceId => {
          const service = services.find(s => s.id === serviceId);
          const ServiceAddsSubForm = service.AddServiceForm;

          return (
            <div key={service.id}>
              <b>{service.name}:</b>
              <ServiceAddsSubForm appId={appId} />
            </div>
          );

          /*
          const service = services.find(s => s.id === serviceId);
          const ServiceAddsSubForm = reduxForm({
            form: `appsEditAddServices_${appId}_${service.id}`,
            fields: [ 'moo' ]
          })(ServiceAddsForm);

          return (
              <ServiceAddsSubForm key={service.id} service={service} />
          );
          */ 
        })
      }
    </div>
  );
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

      <ServiceAdds appId={app._id} services={services}
        appServices={appsEditAddServices && appsEditAddServices[app._id]} />

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
