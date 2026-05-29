import type * as React from 'react';
import {
  createGridCellMap,
  getGridCellIndexOfCorner,
  getGridCellIndices,
  getGridNavigatedIndex,
  isListIndexDisabled,
} from '../utils/composite';
import { ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT } from '../utils/constants';

export type DisabledIndices = ReadonlyArray<number> | ((index: number) => boolean);

export function gridNavigation(
  event: React.KeyboardEvent,
  prevIndex: number,
  listRef: React.RefObject<Array<HTMLElement | null>>,
  orientation: 'horizontal' | 'vertical' | 'both',
  loopFocus: boolean,
  rtl: boolean,
  disabledIndices: DisabledIndices | undefined,
  minIndex: number,
  maxIndex: number,
  cols = 2,
): number | undefined {
  const sizes = Array.from({ length: listRef.current.length }, () => ({
    width: 1,
    height: 1,
  }));
  // Navigate through hypothetical 1x1 grid cells, then map back to item indices.
  const cellMap = createGridCellMap(sizes, cols, false);
  const minGridIndex = cellMap.findIndex(
    (index) => index != null && !isListIndexDisabled(listRef.current, index, disabledIndices),
  );
  const maxGridIndex = cellMap.reduce(
    (foundIndex: number, index, cellIndex) =>
      index != null && !isListIndexDisabled(listRef.current, index, disabledIndices)
        ? cellIndex
        : foundIndex,
    -1,
  );

  return cellMap[
    getGridNavigatedIndex(
      cellMap.map((itemIndex) => (itemIndex != null ? listRef.current[itemIndex] : null)),
      {
        event,
        orientation,
        loopFocus,
        rtl,
        cols,
        // Treat empty grid cells as disabled so navigation skips them.
        disabledIndices: getGridCellIndices(
          [
            ...((typeof disabledIndices !== 'function' ? disabledIndices : null) ||
              listRef.current.map((_, listIndex) =>
                isListIndexDisabled(listRef.current, listIndex, disabledIndices)
                  ? listIndex
                  : undefined,
              )),
            undefined,
          ],
          cellMap,
        ),
        minIndex: minGridIndex,
        maxIndex: maxGridIndex,
        prevIndex: getGridCellIndexOfCorner(
          prevIndex > maxIndex ? minIndex : prevIndex,
          sizes,
          cellMap,
          cols,
          // Match the corner to the movement edge to avoid landing on the same item.
          // eslint-disable-next-line no-nested-ternary
          event.key === ARROW_DOWN
            ? 'bl'
            : event.key === (rtl ? ARROW_LEFT : ARROW_RIGHT)
              ? 'tr'
              : 'tl',
        ),
        stopEvent: true,
      },
    )
  ];
}
