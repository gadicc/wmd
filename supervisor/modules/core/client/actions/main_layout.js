export default {
  onTabClick({FlowRouter}, tab) {
    FlowRouter.go(`/${tab}`);
  },
  onChange({FlowRouter}, idx, tab) {
    FlowRouter.go(`/${tab}`);
  }
}
