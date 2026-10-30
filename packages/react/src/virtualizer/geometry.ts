/**
 * The geometry the virtualizer's concerns read, in its own vocabulary.
 *
 * Both shapes are structural subsets of what the engine publishes, so the engine's objects satisfy
 * them as they are — no conversion, and the identity comparisons that tell one geometry commit
 * from the next keep working. Only `Virtualizer` itself knows where the objects come from.
 */

/**
 * The half-open range of rows currently mounted: `firstRowIndex` inclusive, `lastRowIndex`
 * exclusive.
 */
export interface RowWindow {
  firstRowIndex: number;
  lastRowIndex: number;
}

/**
 * Row positions as of one geometry commit. `positions[i]` is where row `i` starts, in the engine's
 * coordinates, which exclude the scrollport's block padding; `currentPageTotalHeight` is where the
 * last row ends.
 */
export interface RowsGeometry {
  positions: readonly number[];
  currentPageTotalHeight: number;
}
