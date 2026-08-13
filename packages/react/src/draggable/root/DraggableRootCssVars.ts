export enum DraggableRootCssVars {
  /**
   * The horizontal distance, in pixels, from this element's new layout position
   * back to the one a reorder displaced it from (previous minus current, so a
   * row that moved up gets a positive value). Present with `data-displacing`;
   * apply it under `data-starting-style` so the transition plays it back to rest.
   * @type {number}
   */
  displacementX = '--drag-displacement-x',
  /**
   * The vertical counterpart of `--drag-displacement-x`.
   * @type {number}
   */
  displacementY = '--drag-displacement-y',
}
