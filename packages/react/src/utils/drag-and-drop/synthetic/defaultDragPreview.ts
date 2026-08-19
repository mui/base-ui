import { resolveDragPreviewOffset } from '../customDragPreview';
import type { SyntheticPreviewHandle } from './syntheticPreview';
import type { ResolvedDragPreview } from './dragPreviewSettings';
import type { DragInput, DragPosition } from '../../../types/drag';

/**
 * Build the element that follows the pointer, unless the draggable opted out.
 *
 * A custom preview gets an empty host for React to render into; otherwise the
 * source is cloned into a sanitized preview that preserves its classes and live state.
 *
 * Runs before `data-dragging` lands on the source, so the clone never inherits it
 * and the usual `[data-dragging] { opacity: .4 }` rule dims the source alone.
 */
export function attachDefaultDragPreview(
  preview: SyntheticPreviewHandle,
  element: HTMLElement,
  settings: ResolvedDragPreview<any>,
  input: DragInput,
  grabOffset: DragPosition,
): void {
  if (settings.disabled) {
    return;
  }

  const previewElement = settings.createPreviewElement?.(element, settings.container);
  if (!previewElement) {
    return;
  }

  // An offset callback needs the preview's rendered size, which a host doesn't have
  // until React fills it — so leave it to the renderer, which resolves it exactly
  // once, after the content lands. Every other form depends only on the source rect
  // and is correct right now, including for a host.
  let offset: DragPosition;
  if (previewElement.isHost && typeof settings.offset === 'function') {
    offset = { x: 0, y: 0 };
  } else if (settings.offset === undefined || settings.offset === 'source') {
    // Distance activation commits on a later pointermove. Keep the offset measured at the
    // original press so crossing that threshold cannot shift the preview in the gesture's
    // direction.
    offset = grabOffset;
  } else {
    offset = resolveDragPreviewOffset(settings.offset, {
      container: previewElement.element,
      sourceRect: previewElement.sourceRect,
      input,
    });
  }
  preview.setPreviewElement(previewElement, offset);
}
