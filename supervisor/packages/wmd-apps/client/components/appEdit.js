import { _ } from 'meteor/underscore';
import React, { PropTypes } from 'react';
import pure from 'recompose/pure';

import AppBar from 'react-toolbox/lib/app_bar';
import { Button } from 'react-toolbox/lib/button';
//import Dialog from 'react-toolbox/lib/dialog';

import { composeWithTracker } from 'mantra-core';
import { reduxForm } from 'redux-form'
import { connect } from 'react-redux';

import { ext } from '../index.js';

import { Apps } from '../context.js';
import { serviceTypes } from 'meteor/wmd-services';

/* --------------------------- presentational ----------------------------- */

const AppEditUI = ({ app, actions, serviceTypes, servicesToAdd }) => (
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

      <h3>Edit Existing Services</h3>

      <ServiceForms
        appId={app._id}
        serviceTypes={serviceTypes}
        servicesToShow={app.services ? _.pluck(app.services, 'service') : undefined}
        appServiceData={app.services}
      />

      <h3>Add New Services</h3>

      <ServiceTypes
        appId={app._id}
        serviceTypes={serviceTypes}
        actions={actions}
        servicesBeingAdded={servicesToAdd}
      />

      <ServiceForms
        appId={app._id}
        serviceTypes={serviceTypes}
        servicesToShow={servicesToAdd}
      />

    </If>
  </div>
);

AppEditUI.propTypes = {
  app: PropTypes.object,
  actions: PropTypes.object.isRequired,
  serviceTypes: PropTypes.object.isRequired,
  servicesToAdd: PropTypes.array
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

const ServiceButtons = pure(function ServiceButtons({appId, services, actions, servicesToAdd}) {
  const disabled = {};
  if (servicesToAdd)
    servicesToAdd.forEach(serviceId => disabled[serviceId] = true);

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

const ServiceForms = pure(function ServiceForms({appId, servicesToShow, serviceTypes, appServiceData }) {
  if (!servicesToShow)
    return null;

  const serviceData = {};
  if (appServiceData)
    appServiceData.forEach(service => serviceData[service.service] = service);

  return (
    <div>
      {
        servicesToShow.map(serviceId => {
          // :(
          var service, serviceType;
          for (serviceType in serviceTypes) {
            service = serviceTypes[serviceType].services.find(s => s.id === serviceId);
            if (service) break;
          }

          const ServiceAddsSubForm = serviceTypes[serviceType]
            .AddServiceForm(appId, service, serviceData[serviceId]);

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

const ServiceTypes = ({appId, actions, servicesBeingAdded, serviceTypes }) => (
  <div>
    { Object.keys(serviceTypes).map(k => serviceTypes[k]).map((st) => (
      <div key={st.id}>
        <span>{st.name}</span>: &nbsp;&nbsp;&nbsp;
        <ServiceButtons appId={appId} services={st.services} actions={actions}
           servicesToAdd={servicesBeingAdded} />
      </div>
    )) }
  </div>
);

ServiceTypes.propTypes = {
  appId: PropTypes.string.isRequired,
  actions: PropTypes.object.isRequired,
  servicesBeingAdded: PropTypes.array,
  serviceTypes: PropTypes.object.isRequired
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
  },

  // the name means in "Add New Services", we've added a service and now we
  // want to remove it.
  appsEditAddServiceRemove(state, action) {
    if (action.type === 'APPS_EDIT_ADDSERVICE_REMOVE') {
      return {
        ...state,
        appsEditAddServices: {
          ...state.appsEditAddServices,
          [action.appId]:
            _.without(state.appsEditAddServices[action.appId], action.serviceId)
        }
      }
    } else
      return state;   
  }

};


/* ----------------------------- container -------------------------------- */

function composer(props, onData) {
  const app = Apps.findOne(props._id);

  // we only care about the servicesToAdd for this app.  note, the full
  // appsEditAddServices object is passed too, that's leak, but would only
  // really ever cause superfluous re-renders if we viewed multiple apps
  // at a time, which we don't.
  const servicesToAdd = props.appsEditAddServices
    ? props.appsEditAddServices[props._id] : undefined;

  onData(null, { servicesToAdd, app, actions, serviceTypes });
}

const mapStateToProps = ({ appsEditAddServices }) => { return { appsEditAddServices }; };

const AppEditData = connect(mapStateToProps)(composeWithTracker(composer)(AppEditUI));

/* ------------------------------ exports --------------------------------- */

export { AppEditUI, actions, reducers };
export default AppEditData;
