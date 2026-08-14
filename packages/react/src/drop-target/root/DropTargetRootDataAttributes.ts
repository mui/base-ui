export enum DropTargetRootDataAttributes {
  /**
   * Present on every registered drop target for as long as it is registered.
   * The one always-on styling hook for "this element is a drop target"; the
   * engine also uses it to resolve targets during hit-testing.
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
   * Present while a drag this target accepts is in progress, wherever the pointer
   * is. The hook for highlighting every valid drop zone at drag start.
   * Absent when `trackDragOver` is `false`.
   */
  accepting = 'data-accepting',
  /**
   * Present while the target is refusing the drag: its `canDrop` returned
   * `'reject'` for the current position. The hook for a "can't drop here"
   * affordance such as a full column. Absent when `trackDragOver` is `false`.
   */
  rejected = 'data-rejected',
  /**
   * Present while the drop target is disabled.
   */
  disabled = 'data-disabled',
}
