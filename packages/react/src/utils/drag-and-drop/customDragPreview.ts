import type {
  DragPreviewOffset,
  DragPosition,
  DragPreviewOffsetParameters,
} from '../../types/drag';

/**
 * Resolve a `DragPreviewOffset` (the `'source'`/`'pointer'` presets, a fixed
 * `DragPosition`, or a callback) into a concrete pointer-relative offset.
 *
 * Defaults to `'source'`: the preview keeps the grab point it was picked up by,
 * so a cloned preview lifts off the element without shifting.
 */
export function resolveDragPreviewOffset(
  offset: DragPreviewOffset | undefined,
  params: DragPreviewOffsetParameters,
): DragPosition {
  if (offset === 'pointer') {
    return { x: 0, y: 0 };
  }
  if (offset === undefined || offset === 'source') {
    return {
      x: params.input.clientX - params.sourceRect.left,
      y: params.input.clientY - params.sourceRect.top,
    };
  }
  if (typeof offset === 'function') {
    return offset(params);
  }
  return offset;
}

/**
 * Expose the source element's size to the preview content as the
 * `--drag-source-width`/`--drag-source-height` CSS variables.
 */
export function applySourceSizeVars(container: HTMLElement, sourceRect: DOMRect): void {
  container.style.setProperty('--drag-source-width', `${sourceRect.width}px`);
  container.style.setProperty('--drag-source-height', `${sourceRect.height}px`);
}
