import ext from '../index.js';

export default {

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

}