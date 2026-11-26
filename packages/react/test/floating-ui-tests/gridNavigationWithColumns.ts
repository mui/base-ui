import { gridNavigation } from '../../src/utils/popups/interactions/gridNavigation';

export function gridNavigationWithColumns(cols: number): typeof gridNavigation {
  return (
    event,
    key,
    prevIndex,
    listRef,
    orientation,
    loopFocus,
    rtl,
    disabledIndices,
    minIndex,
    maxIndex,
  ) =>
    gridNavigation(
      event,
      key,
      prevIndex,
      listRef,
      orientation,
      loopFocus,
      rtl,
      disabledIndices,
      minIndex,
      maxIndex,
      cols,
    );
}
