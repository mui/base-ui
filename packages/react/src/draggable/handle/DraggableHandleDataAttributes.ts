export enum DraggableHandleDataAttributes {
  /**
   * Present while the handle's `Draggable.Root` is disabled. A handle has no
   * disabled state of its own — it follows the root, which is what the engine
   * reads when refusing a pickup.
   */
  disabled = 'data-disabled',
}
