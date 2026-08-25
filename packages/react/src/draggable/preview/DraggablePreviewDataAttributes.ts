import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

export enum DraggablePreviewDataAttributes {
  /**
   * Present on the drag preview element. A cloned preview keeps the source's
   * classes, so use this attribute to distinguish them in CSS.
   */
  dragPreview = 'data-drag-preview',
  /**
   * Present on a cloned preview created by Base UI after a deliberate release while
   * it moves to its final position. This also applies when a drag is released
   * outside a target and returns to its source. The clone remains mounted until
   * animations started by this state finish.
   */
  endingStyle = TransitionStatusDataAttributes.endingStyle,
}
