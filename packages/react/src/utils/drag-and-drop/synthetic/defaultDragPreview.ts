import { resolveDragPreviewOffset } from '../customDragPreview';
import type { SyntheticPreviewHandle } from './syntheticPreview';
import type { ResolvedDragPreview } from './dragPreviewSettings';
import type { DraggableInput, DraggablePosition } from '../../../types/drag';

/**
 * Build the element that follows the pointer, unless the draggable opted out.
 *
 * A custom preview gets an empty host for React to render into; otherwise the
 * source is cloned into a sanitized preview that preserves its classes and live state.
 *
 * Runs before `data-dragging` lands on the source, so the clone never inherits it
 * and the usual `[data-dragging] { opacity: .4 }` rule dims the source alone.
 *
 * `pressInput` is the original press, where `input` is the pointer state the pickup
 * committed on. Distance activation commits on a later `pointermove`, so the
 * default `'source'` offset is measured from the press: crossing the threshold must
 * not shift the preview in the gesture's direction.
 */
export function attachDefaultDragPreview(
  preview: SyntheticPreviewHandle,
  element: HTMLElement,
  settings: ResolvedDragPreview<any>,
  input: DraggableInput,
  pressInput: DraggableInput,
): void {
  if (settings.disabled) {
    return;
  }

  const previewElement = settings.createPreviewElement(element, settings.container);
  if (!previewElement) {
    return;
  }

  // Own the element before invoking consumer code so pickup cleanup can release it.
  preview.setPreviewElement(previewElement);

  // An offset callback needs the preview's rendered size, which a host doesn't have
  // until React fills it — so leave it to the renderer, which resolves it exactly
  // once, after the content lands. Every other form depends only on the source rect
  // and is correct right now, including for a host.
  let offset: DraggablePosition;
  if (previewElement.isHost && typeof settings.offset === 'function') {
    offset = { x: 0, y: 0 };
  } else {
    const isSourceOffset = settings.offset === undefined || settings.offset === 'source';
    offset = resolveDragPreviewOffset(settings.offset, {
      container: previewElement.element,
      // The rect the preview actually occupies: for a transformed source this is the
      // untransformed box the clone is anchored on (see `createPreparedDragPreviewElement`),
      // not the transformed one `getBoundingClientRect` reports, so the clone lifts off
      // exactly where the source sits.
      sourceRect: previewElement.sourceRect,
      input: isSourceOffset ? pressInput : input,
    });
  }
  preview.setPreviewOffset(offset);
}
