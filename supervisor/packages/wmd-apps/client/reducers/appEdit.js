export default {

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

}