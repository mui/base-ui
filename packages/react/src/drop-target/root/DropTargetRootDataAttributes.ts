export enum DropTargetRootDataAttributes {
  /**
   * Present while the element is registered as a drop target. Base UI also uses
   * it to resolve targets during hit testing.
   */
  dropTarget = 'data-drop-target',
  /**
   * Present while a matching drag source is over the target or a nested descendant.
   * Absent when `trackDragOver` is `false`.
   */
  dragOver = 'data-drag-over',
  /**
   * Present while the target is the innermost one under the source.
   * Absent when `trackDragOver` is `false`.
   */
  dragOverInnermost = 'data-drag-over-innermost',
  /**
   * Present while a drag this target accepts is active, regardless of pointer
   * position. Use it to highlight every compatible drop target.
   * Absent when `trackDragOver` is `false`.
   */
  accepting = 'data-accepting',
  /**
   * Present while `canDrop` returns `'reject'` for the current position. Use it
   * to display feedback such as a full column. Absent when `trackDragOver` is
   * `false`.
   */
  rejected = 'data-rejected',
  /**
   * Present while the drop target is disabled.
   */
  disabled = 'data-disabled',
}
