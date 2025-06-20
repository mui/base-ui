import { findLast } from '../../utils/findLast';

export type PageGridNavigationTarget =
  | { type: 'first-cell' }
  | { type: 'last-cell' }
  | { type: 'first-cell-in-col'; colIndex: number }
  | { type: 'last-cell-in-col'; colIndex: number }
  | { type: 'first-cell-in-row'; rowIndex: number }
  | { type: 'last-cell-in-row'; rowIndex: number };

export type NavigateInGridChangePage = (params: {
  direction: 'next' | 'previous';
  target: PageGridNavigationTarget;
}) => void;

export function applyInitialFocusInGrid({
  cells,
  target,
}: {
  cells: HTMLElement[][][];
  target: PageGridNavigationTarget;
}) {
  let cell: HTMLElement | undefined;

  if (target.type === 'first-cell') {
    cell = cells.flat(2).find(isNavigable);
  }

  if (target.type === 'last-cell') {
    cell = findLast(cells.flat(2), isNavigable);
  }

  if (target.type === 'first-cell-in-col') {
    cell = cells
      .flat(1)
      .map((row) => row[target.colIndex])
      .find(isNavigable);
  }

  // TODO: Support when the 1st month is fully disabled.
  if (target.type === 'last-cell-in-col') {
    cell = findLast(
      cells.flat(1).map((row) => row[target.colIndex]),
      isNavigable,
    );
  }

  if (cell) {
    cell.focus();
  }
}

function isNavigable(element: HTMLElement | null): element is HTMLElement {
  if (element === null) {
    return false;
  }

  if (element.hasAttribute('disabled') || element.getAttribute('data-disabled') === 'true') {
    return false;
  }

  if (element.getAttribute('data-outside-month') != null) {
    return false;
  }

  return true;
}
