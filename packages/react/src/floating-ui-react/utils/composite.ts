import { floor } from '@floating-ui/utils';

import type { Dimensions } from '../types';
import { stopEvent } from './event';
import { ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, ARROW_UP } from './constants';

type DisabledIndices = ReadonlyArray<number> | ((index: number) => boolean);

export function isDifferentGridRow(index: number, cols: number, prevRow: number) {
  return Math.floor(index / cols) !== prevRow;
}

export function isIndexOutOfListBounds(
  listRef: React.RefObject<Array<HTMLElement | null>>,
  index: number,
) {
  return index < 0 || index >= listRef.current.length;
}

export function getMinListIndex(
  listRef: React.RefObject<ReadonlyArray<HTMLElement | null>>,
  disabledIndices?: DisabledIndices | undefined,
) {
  return findNonDisabledListIndex(listRef, { disabledIndices });
}

export function getMaxListIndex(
  listRef: React.RefObject<Array<HTMLElement | null>>,
  disabledIndices?: DisabledIndices | undefined,
) {
  return findNonDisabledListIndex(listRef, {
    decrement: true,
    startingIndex: listRef.current.length,
    disabledIndices,
  });
}

export function findNonDisabledListIndex(
  listRef: React.RefObject<ReadonlyArray<HTMLElement | null>>,
  {
    startingIndex = -1,
    decrement = false,
    disabledIndices,
    amount = 1,
  }: {
    startingIndex?: number | undefined;
    decrement?: boolean | undefined;
    disabledIndices?: DisabledIndices | undefined;
    amount?: number | undefined;
  } = {},
): number {
  let index = startingIndex;
  do {
    index += decrement ? -amount : amount;
  } while (
    index >= 0 &&
    index <= listRef.current.length - 1 &&
    isListIndexDisabled(listRef, index, disabledIndices)
  );

  return index;
}

export function getGridNavigatedIndex(
  listRef: React.RefObject<Array<HTMLElement | null>>,
  {
    event,
    orientation,
    loopFocus,
    rtl,
    cols,
    disabledIndices,
    minIndex,
    maxIndex,
    prevIndex,
    stopEvent: stop = false,
  }: {
    event: React.KeyboardEvent;
    orientation: 'horizontal' | 'vertical' | 'both';
    loopFocus: boolean;
    rtl: boolean;
    cols: number;
    disabledIndices: DisabledIndices | undefined;
    minIndex: number;
    maxIndex: number;
    prevIndex: number;
    stopEvent?: boolean | undefined;
  },
) {
  let nextIndex = prevIndex;

  // ---------------------------------------------------------------------------
  // Detect row structure based on DOM. This works when items are grouped inside
  // elements that declare `role="row"` (e.g., Combobox.Row). We build a matrix
  // where each entry is the array of item indices for that visual row. The
  // algorithm gracefully falls back to regular `cols`-based handling when no
  // row structure can be detected.
  // ---------------------------------------------------------------------------
  const rows: number[][] = [];
  const rowIndexMap: Record<number, number> = {};
  let hasRoleRow = false;
  {
    let currentRowEl: Element | null = null;
    let currentRowIndex = -1;

    listRef.current.forEach((el, idx) => {
      if (el == null) {
        return;
      }
      const rowEl = el.closest('[role="row"]');
      if (rowEl) {
        hasRoleRow = true;
      }
      if (rowEl !== currentRowEl || currentRowIndex === -1) {
        currentRowEl = rowEl;
        currentRowIndex += 1;
        rows[currentRowIndex] = [];
      }
      rows[currentRowIndex].push(idx);
      rowIndexMap[idx] = currentRowIndex;
    });
  }

  const hasDomRows = hasRoleRow && rows.length > 0 && rows.some((row) => row.length !== cols);

  function navigateVertically(direction: 'up' | 'down') {
    if (!hasDomRows || prevIndex === -1) {
      return undefined;
    }
    const currentRow = rowIndexMap[prevIndex];
    if (currentRow == null) {
      return undefined;
    }
    const colInRow = rows[currentRow].indexOf(prevIndex);

    let nextRow = direction === 'up' ? currentRow - 1 : currentRow + 1;
    if (loopFocus) {
      if (nextRow < 0) {
        nextRow = rows.length - 1;
      } else if (nextRow >= rows.length) {
        nextRow = 0;
      }
    }

    const visited = new Set<number>();
    while (nextRow >= 0 && nextRow < rows.length && !visited.has(nextRow)) {
      visited.add(nextRow);
      const targetRow = rows[nextRow];
      if (targetRow.length === 0) {
        nextRow = direction === 'up' ? nextRow - 1 : nextRow + 1;
        continue;
      }
      const clampedCol = Math.min(colInRow, targetRow.length - 1);
      // Start from the preferred column, fallback leftwards until first
      // enabled item is found.
      for (let col = clampedCol; col >= 0; col -= 1) {
        const candidate = targetRow[col];
        if (!isListIndexDisabled(listRef, candidate, disabledIndices)) {
          return candidate;
        }
      }
      // Row had no enabled items, move to next row in the same direction.
      nextRow = direction === 'up' ? nextRow - 1 : nextRow + 1;

      if (loopFocus) {
        if (nextRow < 0) {
          nextRow = rows.length - 1;
        } else if (nextRow >= rows.length) {
          nextRow = 0;
        }
      }
    }
    return undefined;
  }

  if (event.key === ARROW_UP) {
    const domBasedCandidate = navigateVertically('up');
    if (domBasedCandidate !== undefined) {
      if (stop) {
        stopEvent(event);
      }
      nextIndex = domBasedCandidate;
    } else {
      // fallback to original logic
      if (stop) {
        stopEvent(event);
      }

      if (prevIndex === -1) {
        nextIndex = maxIndex;
      } else {
        nextIndex = findNonDisabledListIndex(listRef, {
          startingIndex: nextIndex,
          amount: cols,
          decrement: true,
          disabledIndices,
        });

        if (loopFocus && (prevIndex - cols < minIndex || nextIndex < 0)) {
          const col = prevIndex % cols;
          const maxCol = maxIndex % cols;
          const offset = maxIndex - (maxCol - col);

          if (maxCol === col) {
            nextIndex = maxIndex;
          } else {
            nextIndex = maxCol > col ? offset : offset - cols;
          }
        }
      }

      if (isIndexOutOfListBounds(listRef, nextIndex)) {
        nextIndex = prevIndex;
      }
    }
  }

  if (event.key === ARROW_DOWN) {
    const domBasedCandidate = navigateVertically('down');
    if (domBasedCandidate !== undefined) {
      if (stop) {
        stopEvent(event);
      }
      nextIndex = domBasedCandidate;
    } else {
      if (stop) {
        stopEvent(event);
      }

      if (prevIndex === -1) {
        nextIndex = minIndex;
      } else {
        nextIndex = findNonDisabledListIndex(listRef, {
          startingIndex: prevIndex,
          amount: cols,
          disabledIndices,
        });

        if (loopFocus && prevIndex + cols > maxIndex) {
          nextIndex = findNonDisabledListIndex(listRef, {
            startingIndex: (prevIndex % cols) - cols,
            amount: cols,
            disabledIndices,
          });
        }
      }

      if (isIndexOutOfListBounds(listRef, nextIndex)) {
        nextIndex = prevIndex;
      }
    }
  }

  // Remains on the same row/column.
  if (orientation === 'both') {
    const prevRow = floor(prevIndex / cols);

    if (event.key === (rtl ? ARROW_LEFT : ARROW_RIGHT)) {
      if (stop) {
        stopEvent(event);
      }

      if (prevIndex % cols !== cols - 1) {
        nextIndex = findNonDisabledListIndex(listRef, {
          startingIndex: prevIndex,
          disabledIndices,
        });

        if (loopFocus && isDifferentGridRow(nextIndex, cols, prevRow)) {
          nextIndex = findNonDisabledListIndex(listRef, {
            startingIndex: prevIndex - (prevIndex % cols) - 1,
            disabledIndices,
          });
        }
      } else if (loopFocus) {
        nextIndex = findNonDisabledListIndex(listRef, {
          startingIndex: prevIndex - (prevIndex % cols) - 1,
          disabledIndices,
        });
      }

      if (isDifferentGridRow(nextIndex, cols, prevRow)) {
        nextIndex = prevIndex;
      }
    }

    if (event.key === (rtl ? ARROW_RIGHT : ARROW_LEFT)) {
      if (stop) {
        stopEvent(event);
      }

      if (prevIndex % cols !== 0) {
        nextIndex = findNonDisabledListIndex(listRef, {
          startingIndex: prevIndex,
          decrement: true,
          disabledIndices,
        });

        if (loopFocus && isDifferentGridRow(nextIndex, cols, prevRow)) {
          nextIndex = findNonDisabledListIndex(listRef, {
            startingIndex: prevIndex + (cols - (prevIndex % cols)),
            decrement: true,
            disabledIndices,
          });
        }
      } else if (loopFocus) {
        nextIndex = findNonDisabledListIndex(listRef, {
          startingIndex: prevIndex + (cols - (prevIndex % cols)),
          decrement: true,
          disabledIndices,
        });
      }

      if (isDifferentGridRow(nextIndex, cols, prevRow)) {
        nextIndex = prevIndex;
      }
    }

    const lastRow = floor(maxIndex / cols) === prevRow;

    if (isIndexOutOfListBounds(listRef, nextIndex)) {
      if (loopFocus && lastRow) {
        nextIndex =
          event.key === (rtl ? ARROW_RIGHT : ARROW_LEFT)
            ? maxIndex
            : findNonDisabledListIndex(listRef, {
                startingIndex: prevIndex - (prevIndex % cols) - 1,
                disabledIndices,
              });
      } else {
        nextIndex = prevIndex;
      }
    }
  }

  return nextIndex;
}

/** For each cell index, gets the item index that occupies that cell */
export function createGridCellMap(sizes: Dimensions[], cols: number, dense: boolean) {
  const cellMap: (number | undefined)[] = [];
  let startIndex = 0;
  sizes.forEach(({ width, height }, index) => {
    if (width > cols) {
      if (process.env.NODE_ENV !== 'production') {
        throw new Error(
          `[Floating UI]: Invalid grid - item width at index ${index} is greater than grid columns`,
        );
      }
    }
    let itemPlaced = false;
    if (dense) {
      startIndex = 0;
    }
    while (!itemPlaced) {
      const targetCells: number[] = [];
      for (let i = 0; i < width; i += 1) {
        for (let j = 0; j < height; j += 1) {
          targetCells.push(startIndex + i + j * cols);
        }
      }
      if (
        (startIndex % cols) + width <= cols &&
        targetCells.every((cell) => cellMap[cell] == null)
      ) {
        targetCells.forEach((cell) => {
          cellMap[cell] = index;
        });
        itemPlaced = true;
      } else {
        startIndex += 1;
      }
    }
  });

  // convert into a non-sparse array
  return [...cellMap];
}

/** Gets cell index of an item's corner or -1 when index is -1. */
export function getGridCellIndexOfCorner(
  index: number,
  sizes: Dimensions[],
  cellMap: (number | undefined)[],
  cols: number,
  corner: 'tl' | 'tr' | 'bl' | 'br',
) {
  if (index === -1) {
    return -1;
  }

  const firstCellIndex = cellMap.indexOf(index);
  const sizeItem = sizes[index];

  switch (corner) {
    case 'tl':
      return firstCellIndex;
    case 'tr':
      if (!sizeItem) {
        return firstCellIndex;
      }
      return firstCellIndex + sizeItem.width - 1;
    case 'bl':
      if (!sizeItem) {
        return firstCellIndex;
      }
      return firstCellIndex + (sizeItem.height - 1) * cols;
    case 'br':
      return cellMap.lastIndexOf(index);
    default:
      return -1;
  }
}

/** Gets all cell indices that correspond to the specified indices */
export function getGridCellIndices(
  indices: (number | undefined)[],
  cellMap: (number | undefined)[],
) {
  return cellMap.flatMap((index, cellIndex) => (indices.includes(index) ? [cellIndex] : []));
}

export function isListIndexDisabled(
  listRef: React.RefObject<ReadonlyArray<HTMLElement | null>>,
  index: number,
  disabledIndices?: DisabledIndices,
) {
  if (typeof disabledIndices === 'function') {
    return disabledIndices(index);
  }
  if (disabledIndices) {
    return disabledIndices.includes(index);
  }

  const element = listRef.current[index];
  if (!element) {
    return false;
  }

  return element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
}
