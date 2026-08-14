import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';

export enum DraggablePreviewDataAttributes {
  /**
   * Present on the drag preview element the engine renders this part's content
   * into. A cloned preview keeps the source's classes, so this is what tells the
   * two apart in CSS.
   */
  dragPreview = 'data-drag-preview',
  /**
   * The input modality driving the drag: `'pointer'` or `'keyboard'`. Use it to ease
   * the preview's `translate` for keyboard drags, which jump between discrete
   * positions, while pointer drags track the cursor without a transition.
   * @type {'pointer' | 'keyboard'}
   */
  dragMode = 'data-drag-mode',
  /**
   * Present on an engine-owned cloned preview after a deliberate release while
   * it moves to its final position. This also applies when a drag is released
   * outside a target and returns to its source. The clone remains mounted until
   * animations started by this state finish.
   */
  endingStyle = TransitionStatusDataAttributes.endingStyle,
}
