import type * as React from 'react';
import { createDragPreviewElement, measurePreviewAnchor } from './cloneDragPreview';
import type { SyntheticPreviewHandle } from './syntheticPreview';
import type { DraggableConfig } from '../draggable';
import { containConsumerError, resolveElementReference } from '../utils';
import type { DraggableInput, DraggablePosition } from '../../../draggable/DraggableProvider';
import type {
  DraggablePreviewOffset,
  DraggablePreviewOffsetParameters,
  DraggablePreviewRenderParameters,
} from '../../../draggable/preview/DraggablePreview';
import type { DraggableRootModifiers } from '../../../draggable/root/DraggableRoot';

/**
 * The preview settings for one drag, resolved from the registration's `preview`,
 * which a `Draggable.Preview` part feeds too. Without one, the engine clones the
 * source.
 * @internal
 */
export interface ResolvedDragPreview {
  offset: DraggablePreviewOffset | undefined;
  modifiers: DraggableRootModifiers | undefined;
  /** Already resolved to an element. `null` inserts the preview beside the source. */
  container: HTMLElement | null;
  disabled: boolean;
  /** React content for a custom preview; `null` for a clone of the source. */
  render: ((parameters: DraggablePreviewRenderParameters<any>) => React.ReactNode) | null;
}

/**
 * Read the drag's preview settings once, at drag start. The engine builds the
 * preview element synchronously from them, before React can run. A
 * `Draggable.Preview` part reaches the engine through `preview` too (see
 * `DragPreviewHandle.preview`).
 * @internal
 */
export function resolveDragPreview(
  parameters: DraggableConfig<any, any>,
  source: HTMLElement,
): ResolvedDragPreview {
  const settings = parameters.preview;
  const disabled = settings?.disabled ?? false;

  return {
    offset: settings?.offset,
    modifiers: settings?.modifiers,
    // Can be a callback, so leave it uninvoked when the preview is disabled.
    container: disabled ? null : resolveElementReference(settings?.container, source),
    disabled,
    render: settings?.render ?? null,
  };
}

/**
 * Resolve a `DraggablePreviewOffset` (the `'source'`/`'pointer'` presets, a fixed
 * `DraggablePosition`, or a callback) into a concrete pointer-relative offset.
 *
 * Defaults to `'source'`, which keeps the grab point the preview was picked up by,
 * so a cloned preview lifts off the element without shifting.
 */
function resolveDragPreviewOffset(
  offset: DraggablePreviewOffset | undefined,
  params: DraggablePreviewOffsetParameters,
): DraggablePosition {
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
 * Build the element that follows the pointer, unless the draggable opted out.
 *
 * Without custom content, the source is cloned into a sanitized preview that keeps
 * its classes and live state. With custom content, the React layer renders it into
 * a detached element, and the preview is a copy of it, built once it has rendered.
 * Both are measured now, before `data-dragging` lands on the source, so the clone
 * never inherits it and the usual `[data-dragging] { opacity: .4 }` rule dims the
 * source alone.
 *
 * `pressInput` is the original press, and `input` is the pointer state the pickup
 * committed on. Distance activation commits on a later `pointermove`, so the
 * default `'source'` offset is measured from the press. Otherwise crossing the
 * threshold would shift the preview in the gesture's direction.
 */
export function attachDragPreview(
  preview: SyntheticPreviewHandle,
  element: HTMLElement,
  settings: ResolvedDragPreview,
  input: DraggableInput,
  pressInput: DraggableInput,
): void {
  if (settings.disabled) {
    return;
  }
  const anchor = measurePreviewAnchor(element, settings.container);
  if (!anchor) {
    return;
  }

  const isSourceOffset = settings.offset === undefined || settings.offset === 'source';
  const resolveOffset = (container: HTMLElement) =>
    resolveDragPreviewOffset(settings.offset, {
      container,
      // The rect the preview occupies. For a transformed source, this is the
      // untransformed box the clone is anchored on (see `measurePreviewSource`), not
      // the transformed one from `getBoundingClientRect`, so the clone lifts off
      // where the source sits.
      sourceRect: anchor.sourceRect,
      input: isSourceOffset ? pressInput : input,
    });

  if (settings.render !== null) {
    preview.attachContent({
      anchor,
      renderContent: settings.render,
      // An offset callback needs the preview's rendered size, so every form resolves
      // once the first copy of the content is in place.
      resolveOffset(container) {
        if (typeof settings.offset !== 'function') {
          return resolveOffset(container);
        }
        // Consumer code. Uncontained, a throw would end the drag from inside the
        // React commit that rendered the content.
        return (
          containConsumerError(
            'Base UI: a drag preview "offset" function threw, so the preview uses the "source" offset.',
            container,
            () => resolveOffset(container),
            null,
          ) ??
          resolveDragPreviewOffset('source', { container, sourceRect: anchor.sourceRect, input })
        );
      },
    });
    return;
  }

  const previewElement = createDragPreviewElement(element, anchor);
  if (!previewElement) {
    return;
  }

  // Own the element before invoking consumer code so pickup cleanup can release it.
  preview.setPreviewElement(previewElement);
  preview.setPreviewOffset(resolveOffset(previewElement.element));
}
