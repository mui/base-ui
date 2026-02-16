export enum DrawerPopupDataAttributes {
  /**
   * Present when the drawer is at the expanded (full-height) snap point.
   */
  expanded = 'data-expanded',
  /**
   * Present when a nested drawer is open.
   */
  nestedDrawerOpen = 'data-nested-drawer-open',
  /**
   * Present when a nested drawer is being swiped.
   */
  nestedDrawerSwiping = 'data-nested-drawer-swiping',
  /**
   * Present when the drawer is dismissed by swiping.
   */
  swipeDismiss = 'data-swipe-dismiss',
  /**
   * Indicates the swipe direction.
   * @type {'up' | 'down' | 'left' | 'right'}
   */
  swipeDirection = 'data-swipe-direction',
  /**
   * Present when the drawer is being swiped.
   */
  swiping = 'data-swiping',
}
