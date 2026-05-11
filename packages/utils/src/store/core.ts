export * from './useStore';
export { StoreCore as Store } from './Store';
export { ReactStoreCore as ReactStore } from './ReactStore';

export function createSelector<Selector extends (...args: any[]) => any>(selector: Selector) {
  return selector;
}
