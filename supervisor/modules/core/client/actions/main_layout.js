export default {
  onTabClick({FlowRouter}, tab) {
    FlowRouter.go(`/${tab}`);
  }
}
