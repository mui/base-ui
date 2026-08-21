export enum DraggableRootCssVars {
  /**
   * The horizontal distance, in pixels, from this element's new layout position
   * to its previous position. It is calculated as previous minus current, so a
   * row that moved up has a positive value. Present with `data-displacing`. Apply
   * it under `data-starting-style` to transition the element to its new position.
   * @type {number}
   */
  displacementX = '--drag-displacement-x',
  /**
   * The vertical counterpart of `--drag-displacement-x`.
   * @type {number}
   */
  displacementY = '--drag-displacement-y',
}
