export default {

  appsEditAddService(state, action) {
    if (action.type === 'APPS_EDIT_ADDSERVICE') {
      if (!state.appsEditAddServices)
        state.appsEditAddServices = {};
      if (!state.appsEditAddServices[action.appId])
        state.appsEditAddServices[action.appId] = [];

      return {
        ...state,
        appsEditAddServices: {
          ...state.appsEditAddServices,
          [action.appId]: [
            ...state.appsEditAddServices[action.appId],
            {
              id: action.service.id
            }
          ]
        }
      };
    } else
      return state;
  }

}