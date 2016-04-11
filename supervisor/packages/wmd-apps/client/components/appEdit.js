import React, { PropTypes } from 'react';
import pure from 'recompose/pure';

import AppBar from 'react-toolbox/lib/app_bar';
import { Button } from 'react-toolbox/lib/button';
//import Dialog from 'react-toolbox/lib/dialog';

import { composeWithTracker } from 'mantra-core';
import { reduxForm } from 'redux-form'
import { connect } from 'react-redux';

import ext from '../index.js';

import { Apps } from '../context.js';
import { serviceTypes } from 'meteor/wmd-services';

/* --------------------------- presentational ----------------------------- */

const AppEditUI = ({ app, actions, serviceTypes, appsEditAddServices }) => (
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

      <ServiceTypes appId={app._id} serviceTypes={serviceTypes} actions={actions}
        appServices={appsEditAddServices && appsEditAddServices[app._id]} />

      <ServiceAdds appId={app._id} serviceTypes={serviceTypes}
        appServices={appsEditAddServices && appsEditAddServices[app._id]} />

    </If>
  </div>
);

AppEditUI.propTypes = {
  app: PropTypes.object,
  actions: PropTypes.object,
  serviceTypes: PropTypes.object,
  appEditAddServices: PropTypes.array
};

/*
Presentational.propTypes = {
  app: React.PropTypes.oneOfType([ React.PropTypes.object, React.PropTypes.any ]),
  actions: React.PropTypes.object,
  services: React.PropTypes.array,
  appsEditAddServices: React.PropTypes.oneOfType([ React.PropTypes.object, React.PropTypes.any ])
};
*/

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

  return ( <span>{
    services.map(service => (
      <Button key={service.id} raised disabled={disabled[service.id]}
          onClick={actions.addService.bind(null, appId, service)} >
        { service.icon ? <img src={service.icon} style={iconStyle} /> : null }
        { service.name }
      </Button>
    ))
  }</span> );
});

const ServiceAdds = pure(function ServiceAdds({appId, appServices, serviceTypes }) {
  if (!appServices)
    return null;

  return (
    <div>
      {
        appServices.map(serviceId => {
          // :(
          var service, serviceType;
          for (serviceType in serviceTypes) {
            service = serviceTypes[serviceType].services.find(s => s.id === serviceId);
            if (service) break;
          }

          //const ServiceAddsSubForm = service.AddServiceForm;
          const ServiceAddsSubForm = serviceTypes[serviceType].AddServiceForm(service);

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

const ServiceTypes = ({appId, actions, appServices, serviceTypes }) => (
  <div>
    { Object.keys(serviceTypes).map(k => serviceTypes[k]).map((st) => (
      <div key={st.id}>
        <span>{st.name}</span>: &nbsp;&nbsp;&nbsp;
        <ServiceButtons appId={appId} services={st.services} actions={actions}
           appServices={appServices} />
      </div>
    )) }
  </div>
);

ServiceTypes.propTypes = {
  appId: PropTypes.string,
  actions: PropTypes.object,
  appServices: PropTypes.array,
  serviceTypes: PropTypes.object
};

/* ------------------------------ actions --------------------------------- */

const actions = {

  addService(appId, service) {
    const { dispatch } = ext.appContext().Store;
    dispatch({
      type: 'APPS_EDIT_ADDSERVICE',
      appId: appId,
      service: service
    });
  },

  back() {
    const { FlowRouter } = ext.appContext();
    FlowRouter.go('/apps');
  }
};

/* ------------------------------ reducers -------------------------------- */

const reducers = {

  appsEditAddService(state, action) {
    if (action.type === 'APPS_EDIT_ADDSERVICE') {
      if (!state.appsEditAddServices)
        state.appsEditAddServices = {};
      if (!state.appsEditAddServices[action.appId])
        state.appsEditAddServices[action.appId] = [];

      /* {
        appsEditAddServices: {
          XbCDFAsgF: [ 'meteor', 'mongo' ]
        }
      } */

      return {
        ...state,
        appsEditAddServices: {
          ...state.appsEditAddServices,
          [action.appId]: [
            ...state.appsEditAddServices[action.appId],
            action.service.id
          ]
        }
      };
    } else
      return state;
  }

};


/* ----------------------------- container -------------------------------- */

function composer(props, onData) {
  const app = Apps.findOne(props._id);
  onData(null, { ...props, app, actions, serviceTypes });
}

const mapStateToProps = ({ appsEditAddServices }) => { return { appsEditAddServices }; };

const AppEditData = connect(mapStateToProps)(composeWithTracker(composer)(AppEditUI));

/* ------------------------------ exports --------------------------------- */

export { AppEditUI, actions, reducers };
export default AppEditData;
