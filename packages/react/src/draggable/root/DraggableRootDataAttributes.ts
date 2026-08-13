import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

export enum DraggableRootDataAttributes {
  /**
   * Present on the source element while it is being dragged.
   * The default preview clone never carries this attribute, so a `[data-dragging]`
   * rule that dims or hides the source leaves the preview fully visible.
   */
  dragging = 'data-dragging',
  /**
   * The input modality driving the drag: `'pointer'` or `'keyboard'`. Present on the
   * source alongside `data-dragging`, and mirrored on the preview element.
   */
  dragMode = 'data-drag-mode',
  /**
   * Present on the source after a deliberate release while an engine-owned clone
   * settles into its final position, including a return after release outside a
   * target. Use it to keep the source styled as a placeholder until the preview's
   * ending animation finishes.
   */
  endingStyle = TransitionStatusDataAttributes.endingStyle,
  /**
   * Present while `trackDisplacement` is animating this element being pushed aside
   * by a reorder, paired with the `--drag-displacement-x`/`--drag-displacement-y`
   * variables. The hook for the displacement transition.
   */
  displacing = 'data-displacing',
  /**
   * Present alongside `data-displacing` on the first frame of a displacement, while
   * the element should still sit at its old position. Style the displaced state
   * under it, and the transition under `data-displacing` without it.
   */
  startingStyle = TransitionStatusDataAttributes.startingStyle,
  /**
   * Present while the draggable is disabled.
   */
  disabled = 'data-disabled',
}
