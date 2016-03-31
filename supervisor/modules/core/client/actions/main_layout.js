export default {
  onChange({FlowRouter}, tab) {
    FlowRouter.go(`/${tab}`);
  }
}
