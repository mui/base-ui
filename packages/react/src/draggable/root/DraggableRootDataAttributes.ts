import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

export enum DraggableRootDataAttributes {
  /**
   * Present on the source element while it is being dragged.
   * A cloned preview never carries this attribute, so a `[data-dragging]`
   * rule that dims or hides the source leaves the preview fully visible.
   */
  dragging = 'data-dragging',
  /**
   * Present on the source after a deliberate release while a clone created by
   * Base UI settles into its final position, including a return after release
   * outside a target. Use it to keep the source styled as a placeholder until
   * the preview's ending animation finishes.
   */
  endingStyle = TransitionStatusDataAttributes.endingStyle,
  /**
   * Present while the draggable is disabled.
   */
  disabled = 'data-disabled',
}
