import type * as React from 'react';
import {
  createGridCellMap,
  getGridCellIndexOfCorner,
  getGridCellIndices,
  getGridNavigatedIndex,
  isListIndexDisabled,
} from '../../../floating-ui-react/utils/composite';
import { ARROW_DOWN, ARROW_RIGHT } from '../composite';

export interface CompositeGridItemSize {
  width: number;
  height: number;
}

export interface CompositeGridConfig {
  columns: number;
  navigation: typeof gridNavigation;
  dense?: boolean | undefined;
  itemSizes?: CompositeGridItemSize[] | undefined;
  onLoop?:
    | ((
        event: React.KeyboardEvent,
        prevIndex: number,
        nextIndex: number,
        elementsRef: React.RefObject<(HTMLDivElement | null)[]>,
      ) => number)
    | undefined;
}

export interface GridNavigationParameters extends Omit<CompositeGridConfig, 'navigation'> {
  event: React.KeyboardEvent;
  elementsRef: React.RefObject<Array<HTMLDivElement | null>>;
  highlightedIndex: number;
  minIndex: number;
  maxIndex: number;
  orientation: 'horizontal' | 'vertical' | 'both';
  loopFocus: boolean;
  disabledIndices?: number[] | undefined;
  rtl: boolean;
}

export function gridNavigation(params: GridNavigationParameters): number {
  const {
    columns,
    dense = false,
    disabledIndices,
    elementsRef,
    event,
    highlightedIndex,
    itemSizes,
    loopFocus,
    maxIndex,
    minIndex,
    onLoop,
    orientation,
    rtl,
  } = params;

  const sizes =
    itemSizes ||
    Array.from({ length: elementsRef.current.length }, () => ({
      width: 1,
      height: 1,
    }));
  const cellMap = createGridCellMap(sizes, columns, dense);
  const minGridIndex = cellMap.findIndex(
    (index) => index != null && !isListIndexDisabled(elementsRef.current, index, disabledIndices),
  );
  const maxGridIndex = cellMap.reduce(
    (foundIndex: number, index, cellIndex) =>
      index != null && !isListIndexDisabled(elementsRef.current, index, disabledIndices)
        ? cellIndex
        : foundIndex,
    -1,
  );
  const wrappedOnLoop = onLoop
    ? (loopEvent: React.KeyboardEvent, prevIndex: number, nextIndex: number) =>
        onLoop(loopEvent, prevIndex, nextIndex, elementsRef)
    : undefined;

  const cellIndex = getGridNavigatedIndex(
    cellMap.map((itemIndex) => (itemIndex != null ? elementsRef.current[itemIndex] : null)),
    {
      event,
      orientation,
      loopFocus,
      onLoop: wrappedOnLoop,
      cols: columns,
      disabledIndices: getGridCellIndices(
        [
          ...(disabledIndices ||
            elementsRef.current.map((_, index) =>
              isListIndexDisabled(elementsRef.current, index) ? index : undefined,
            )),
          undefined,
        ],
        cellMap,
      ),
      minIndex: minGridIndex,
      maxIndex: maxGridIndex,
      prevIndex: getGridCellIndexOfCorner(
        highlightedIndex > maxIndex ? minIndex : highlightedIndex,
        sizes,
        cellMap,
        columns,
        event.key === ARROW_DOWN ? 'bl' : event.key === ARROW_RIGHT ? 'tr' : 'tl',
      ),
      rtl,
    },
  );

  return cellMap[cellIndex] as number;
}
