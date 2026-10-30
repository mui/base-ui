import type { RowWindow, RowsGeometry } from './geometry';
import type { RowsInset } from './scrollport';

/**
 * Where the window stands in the scroll container, in scroll coordinates, and what places it
 * there: the spacers that reserve the space of the rows around it, and the sticky insets that hold
 * it in view once a scroll outruns it. Also what tells a window held at the scrollport's edge from
 * one standing where its rows belong, without measuring either.
 */
export interface WindowPlacement {
  /** Whether the rows are windowed at all; every row is in place otherwise. */
  windowed: boolean;
  /** Where the window's box begins when nothing holds it: the rows' inset plus its offset. */
  top: number;
  /** The height its insets were computed for. */
  height: number;
  insetTop: number;
  insetBottom: number;
  /** The block the window may not leave: its containing block. */
  blockStart: number;
  blockEnd: number;
  /** Where the scrollport's content edge begins past `scrollTop`, and how tall the content box is. */
  scrollportPaddingStart: number;
  viewportHeight: number;
  /** The space of the rows above the window, which places the window where its rows belong. */
  spacerHeight: number;
  /**
   * The space of the rows below the window: what is left of the rows' space once the window's own
   * height is taken out. A table's section needs it spelled out, having no height of its own.
   */
  endSpacerHeight: number;
}

export const EMPTY_WINDOW_PLACEMENT: WindowPlacement = {
  windowed: false,
  top: 0,
  height: 0,
  insetTop: 0,
  insetBottom: 0,
  blockStart: 0,
  blockEnd: 0,
  scrollportPaddingStart: 0,
  viewportHeight: 0,
  spacerHeight: 0,
  endSpacerHeight: 0,
};

export interface WindowPlacementInputs {
  /** Whether the rows are windowed at all. */
  windowed: boolean;
  /** The rows the engine windows, as a half-open range. */
  window: RowWindow;
  rowCount: number;
  geometry: RowsGeometry;
  /**
   * The window's height: worked out from the geometry while rendering, or read from the DOM for
   * a table section, which is as tall as its rows whatever the geometry says they are.
   */
  windowHeight: number;
  /** The scrollport's content-box height. */
  viewportHeight: number;
  /** What the rows are laid out after and before in the scroll container, in scroll coordinates. */
  rowsInset: RowsInset;
  /** The scrollport's own block padding. */
  scrollportPadding: RowsInset;
  /**
   * Whether the window is a table's row group. Its containing block is the whole table, which
   * holds more than the rows' space.
   */
  table: boolean;
}

const NO_SURROUNDINGS: RowsInset = { start: 0, end: 0 };

/**
 * Places the window: where it stands when nothing holds it, the spacers around it, and the sticky
 * insets that let native scrolling move its rows within it and hold them in view beyond.
 */
export function placeWindow(inputs: WindowPlacementInputs): WindowPlacement {
  const {
    geometry,
    rowCount,
    rowsInset,
    scrollportPadding,
    table,
    viewportHeight,
    window,
    windowHeight,
    windowed,
  } = inputs;
  const rowsTotalHeight = geometry.currentPageTotalHeight;
  const offsetTop = geometry.positions[window.firstRowIndex] ?? 0;
  // When the window holds the final row, its rows end where the content does rather than where
  // the estimates put its end: a scrollbar drag defers measurements, and the tail has to stay
  // flush with the scrollport's end edge meanwhile. Off when the whole collection is rendered,
  // whose first row's exact position, zero, is what to keep.
  const tailAnchored = window.firstRowIndex > 0 && window.lastRowIndex >= rowCount;
  const spacerHeight = tailAnchored ? Math.max(0, rowsTotalHeight - windowHeight) : offsetTop;
  // What the block the window is stuck within holds around the rows' space. A list's holds the
  // rows' space alone. A table is the block its section is stuck within, and it holds more: what
  // the scroll container holds around that space besides its own padding — the table's header,
  // the rows after the reserved space — is what the section must not be pushed over at either
  // end of the collection, so each inset is pulled out by what lies at the other end.
  const surroundings: RowsInset = table
    ? {
        start: Math.max(0, rowsInset.start - scrollportPadding.start),
        end: Math.max(0, rowsInset.end - scrollportPadding.end),
      }
    : NO_SURROUNDINGS;
  // Negative by however much taller than the scrollport the window is, so that native scrolling
  // moves the rows within the window and the scrollport never leaves it. Clamped at zero: a
  // window shorter than the scrollport, as a short collection's is, must not stick at all.
  const stickyInset = Math.min(0, viewportHeight - windowHeight);

  return {
    windowed,
    top: rowsInset.start + spacerHeight,
    height: windowHeight,
    insetTop: stickyInset - surroundings.end,
    insetBottom: stickyInset - surroundings.start,
    blockStart: rowsInset.start - surroundings.start,
    blockEnd: rowsInset.start + rowsTotalHeight + surroundings.end,
    scrollportPaddingStart: scrollportPadding.start,
    viewportHeight,
    spacerHeight,
    endSpacerHeight: Math.max(0, rowsTotalHeight - spacerHeight - windowHeight),
  };
}

/**
 * The window's height as far as it is known: the geometry's, but for the rows whose measurements
 * a scrollbar drag is holding back, which are as tall as they measured. The two only differ during
 * a drag, which is when the difference matters most: the geometry keeps the estimates for as long
 * as the drag lasts, while the window is as tall as its real rows, and its insets and its place at
 * the tail have to be worked out from that.
 */
export function getWindowHeight(
  geometry: RowsGeometry,
  window: RowWindow,
  rows: ReadonlyArray<{ id: React.Key }>,
  getDeferredHeight: (rowId: React.Key) => number | undefined,
) {
  const { currentPageTotalHeight, positions } = geometry;

  // Geometry retained from the previous collection while the engine hydrates the new rows says
  // nothing about them row by row.
  if (positions.length !== rows.length) {
    // `lastRowIndex` is exclusive: when it points past the last row, the window extends to the
    // end of the content.
    const windowEnd = positions[window.lastRowIndex] ?? currentPageTotalHeight;
    return Math.max(0, windowEnd - (positions[window.firstRowIndex] ?? 0));
  }

  const lastRowIndex = Math.min(window.lastRowIndex, rows.length);
  let height = 0;
  for (let rowIndex = window.firstRowIndex; rowIndex < lastRowIndex; rowIndex += 1) {
    const rowEnd = positions[rowIndex + 1] ?? currentPageTotalHeight;
    height += getDeferredHeight(rows[rowIndex].id) ?? rowEnd - positions[rowIndex];
  }
  return height;
}

/**
 * How far the sticky window's insets move it from its normal position at the given scroll
 * position: positive when pushed down, negative when pushed up. A sticky box moves only while an
 * inset asks it to and as far as its containing block leaves room, and its start inset wins over
 * its end inset, which is the rule the browser applies, here on the numbers the window was laid
 * out with. Sticky boxes are stuck against the scrollport's content edge, inside its padding.
 */
function getStickyOffset(placement: WindowPlacement, scrollTop: number) {
  const { top, height, insetTop, insetBottom, blockStart, blockEnd } = placement;
  const contentTop = scrollTop + placement.scrollportPaddingStart;
  const contentBottom = contentTop + placement.viewportHeight;
  const bottom = top + height;

  const pushDown = contentTop + insetTop - top;
  if (pushDown > 0) {
    const offset = Math.min(pushDown, Math.max(0, blockEnd - bottom));
    if (offset > 0) {
      return offset;
    }
  }

  const pushUp = bottom - (contentBottom - insetBottom);
  if (pushUp > 0) {
    return -Math.min(pushUp, Math.max(0, top - blockStart));
  }

  return 0;
}

/**
 * Whether a sticky window is displaced from its normal position at the given scroll position,
 * by more than a pixel of rounding.
 */
export function isWindowDisplaced(placement: WindowPlacement, scrollTop: number) {
  return Math.abs(getStickyOffset(placement, scrollTop)) > 1;
}

/**
 * The insets that freeze a sticky window where it stands at the given scroll position: where its
 * own insets put it, stuck at both edges, so that any further scroll moves the scrollport and not
 * the window.
 */
export function getFrozenInsets(
  placement: WindowPlacement,
  scrollTop: number,
): Pick<WindowPlacement, 'insetTop' | 'insetBottom'> {
  const contentTop = scrollTop + placement.scrollportPaddingStart;
  const frozenTop = placement.top + getStickyOffset(placement, scrollTop);
  return {
    insetTop: frozenTop - contentTop,
    insetBottom: contentTop + placement.viewportHeight - (frozenTop + placement.height),
  };
}
