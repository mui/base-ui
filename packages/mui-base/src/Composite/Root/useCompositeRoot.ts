'use client';
import * as React from 'react';
import { hasComputedStyleMapSupport } from '../../utils/hasComputedStyleMapSupport';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEventCallback } from '../../utils/useEventCallback';
import { useForkRef } from '../../utils/useForkRef';
import { ownerWindow } from '../../utils/owner';
import {
  ALL_KEYS,
  ALL_KEYS_WITH_EXTRA_KEYS,
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  HOME,
  END,
  buildCellMap,
  findNonDisabledIndex,
  getCellIndexOfCorner,
  getCellIndices,
  getGridNavigatedIndex,
  getMaxIndex,
  getMinIndex,
  HORIZONTAL_KEYS,
  HORIZONTAL_KEYS_WITH_EXTRA_KEYS,
  isDisabled,
  isIndexOutOfBounds,
  VERTICAL_KEYS,
  VERTICAL_KEYS_WITH_EXTRA_KEYS,
  type Dimensions,
  type TextDirection,
} from '../composite';

export interface UseCompositeRootParameters {
  orientation?: 'horizontal' | 'vertical' | 'both';
  cols?: number;
  loop?: boolean;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  dense?: boolean;
  itemSizes?: Array<Dimensions>;
  rootRef?: React.Ref<Element>;
  enableHomeAndEndKeys?: boolean;
}

function getTextDirection(element: HTMLElement): TextDirection {
  if (hasComputedStyleMapSupport()) {
    const direction = element.computedStyleMap().get('direction');

    return (direction as CSSKeywordValue)?.value as TextDirection;
  }

  return ownerWindow(element).getComputedStyle(element).direction as TextDirection;
}

// Advanced options of Composite, to be implemented later if needed.
const disabledIndices = undefined;

/**
 * @ignore - internal hook.
 */
export function useCompositeRoot(params: UseCompositeRootParameters) {
  const {
    itemSizes,
    cols = 1,
    loop = true,
    dense = false,
    orientation = 'both',
    activeIndex: externalActiveIndex,
    onActiveIndexChange: externalSetActiveIndex,
    rootRef: externalRef,
    enableHomeAndEndKeys = false,
  } = params;

  const [internalActiveIndex, internalSetActiveIndex] = React.useState(0);

  const isGrid = cols > 1;

  const activeIndex = externalActiveIndex ?? internalActiveIndex;
  const onActiveIndexChange = useEventCallback(externalSetActiveIndex ?? internalSetActiveIndex);

  const textDirectionRef = React.useRef<TextDirection | null>(null);

  const rootRef = React.useRef<HTMLElement | null>(null);
  const handleRootRef = useEventCallback((element: HTMLElement) => {
    if (!element) {
      return;
    }

    rootRef.current = element;

    textDirectionRef.current = getTextDirection(element);
  });
  const mergedRef = useForkRef(handleRootRef, externalRef);

  const elementsRef = React.useRef<Array<HTMLDivElement | null>>([]);

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        'aria-orientation': orientation === 'both' ? undefined : orientation,
        ref: mergedRef,
        onKeyDown(event) {
          const ALL_RELEVANT_KEYS = enableHomeAndEndKeys ? ALL_KEYS_WITH_EXTRA_KEYS : ALL_KEYS;

          if (!ALL_RELEVANT_KEYS.includes(event.key)) {
            return;
          }

          const isRtl = textDirectionRef?.current === 'rtl';

          let nextIndex = activeIndex;
          const minIndex = getMinIndex(elementsRef, disabledIndices);
          const maxIndex = getMaxIndex(elementsRef, disabledIndices);

          if (isGrid) {
            const sizes =
              itemSizes ||
              Array.from({ length: elementsRef.current.length }, () => ({
                width: 1,
                height: 1,
              }));
            // To calculate movements on the grid, we use hypothetical cell indices
            // as if every item was 1x1, then convert back to real indices.
            const cellMap = buildCellMap(sizes, cols, dense);
            const minGridIndex = cellMap.findIndex(
              (index) => index != null && !isDisabled(elementsRef.current, index, disabledIndices),
            );
            // last enabled index
            const maxGridIndex = cellMap.reduce(
              (foundIndex: number, index, cellIndex) =>
                index != null && !isDisabled(elementsRef.current, index, disabledIndices)
                  ? cellIndex
                  : foundIndex,
              -1,
            );

            nextIndex = cellMap[
              getGridNavigatedIndex(
                {
                  current: cellMap.map((itemIndex) =>
                    itemIndex ? elementsRef.current[itemIndex] : null,
                  ),
                },
                {
                  event,
                  orientation,
                  loop,
                  cols,
                  // treat undefined (empty grid spaces) as disabled indices so we
                  // don't end up in them
                  disabledIndices: getCellIndices(
                    [
                      ...(disabledIndices ||
                        elementsRef.current.map((_, index) =>
                          isDisabled(elementsRef.current, index) ? index : undefined,
                        )),
                      undefined,
                    ],
                    cellMap,
                  ),
                  minIndex: minGridIndex,
                  maxIndex: maxGridIndex,
                  prevIndex: getCellIndexOfCorner(
                    activeIndex > maxIndex ? minIndex : activeIndex,
                    sizes,
                    cellMap,
                    cols,
                    // use a corner matching the edge closest to the direction we're
                    // moving in so we don't end up in the same item. Prefer
                    // top/left over bottom/right.
                    // eslint-disable-next-line no-nested-ternary
                    event.key === ARROW_DOWN ? 'bl' : event.key === ARROW_RIGHT ? 'tr' : 'tl',
                  ),
                  rtl: isRtl,
                },
              )
            ] as number; // navigated cell will never be nullish
          }

          const toEndKeys = isRtl
            ? {
                horizontal: [ARROW_LEFT],
                vertical: [ARROW_DOWN],
                both: [ARROW_LEFT, ARROW_DOWN],
              }[orientation]
            : {
                horizontal: [ARROW_RIGHT],
                vertical: [ARROW_DOWN],
                both: [ARROW_RIGHT, ARROW_DOWN],
              }[orientation];

          const toStartKeys = isRtl
            ? {
                horizontal: [ARROW_RIGHT],
                vertical: [ARROW_UP],
                both: [ARROW_RIGHT, ARROW_UP],
              }[orientation]
            : {
                horizontal: [ARROW_LEFT],
                vertical: [ARROW_UP],
                both: [ARROW_LEFT, ARROW_UP],
              }[orientation];

          const preventedKeys = isGrid
            ? ALL_RELEVANT_KEYS
            : {
                horizontal: enableHomeAndEndKeys
                  ? HORIZONTAL_KEYS_WITH_EXTRA_KEYS
                  : HORIZONTAL_KEYS,
                vertical: enableHomeAndEndKeys ? VERTICAL_KEYS_WITH_EXTRA_KEYS : VERTICAL_KEYS,
                both: ALL_RELEVANT_KEYS,
              }[orientation];

          if (enableHomeAndEndKeys) {
            if (event.key === HOME) {
              nextIndex = minIndex;
            } else if (event.key === END) {
              nextIndex = maxIndex;
            }
          }

          if (nextIndex === activeIndex && [...toEndKeys, ...toStartKeys].includes(event.key)) {
            if (loop && nextIndex === maxIndex && toEndKeys.includes(event.key)) {
              nextIndex = minIndex;
            } else if (loop && nextIndex === minIndex && toStartKeys.includes(event.key)) {
              nextIndex = maxIndex;
            } else {
              nextIndex = findNonDisabledIndex(elementsRef, {
                startingIndex: nextIndex,
                decrement: toStartKeys.includes(event.key),
                disabledIndices,
              });
            }
          }

          if (nextIndex !== activeIndex && !isIndexOutOfBounds(elementsRef, nextIndex)) {
            event.stopPropagation();

            if (preventedKeys.includes(event.key)) {
              event.preventDefault();
            }

            onActiveIndexChange(nextIndex);

            elementsRef.current[nextIndex]?.focus();
          }
        },
      }),
    [
      activeIndex,
      cols,
      dense,
      elementsRef,
      isGrid,
      itemSizes,
      loop,
      mergedRef,
      onActiveIndexChange,
      orientation,
      enableHomeAndEndKeys,
    ],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      activeIndex,
      onActiveIndexChange,
      elementsRef,
    }),
    [getRootProps, activeIndex, onActiveIndexChange, elementsRef],
  );
}
