export const drawerOpenStateMapping = {
  open(value: boolean) {
    return { 'data-open': value ? '' : undefined, 'data-closed': !value ? '' : undefined };
  },
};

export enum DrawerPopupDataAttributes {
  nestedDrawerOpen = 'data-nested-drawer-open',
  nestedDrawerSwiping = 'data-nested-drawer-swiping',
  swipeDirection = 'data-swipe-direction',
  swiping = 'data-swiping',
}
