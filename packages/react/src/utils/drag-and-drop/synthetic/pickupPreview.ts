import type * as React from 'react';
import { createDragPreviewElement } from './cloneDragPreview';
import type { SyntheticPreviewHandle } from './syntheticPreview';
import type { DraggableConfig } from '../draggable';
import { resolveElementReference } from '../utils';
import type { DraggableInput, DraggablePosition } from '../../../draggable/DraggableProvider';
import type {
  DraggablePreviewOffset,
  DraggablePreviewOffsetParameters,
  DraggablePreviewRenderParameters,
} from '../../../draggable/preview/DraggablePreview';
import type { DraggableRootModifiers } from '../../../draggable/root/DraggableRoot';

/**
 * The preview one drag will use, resolved from the draggable's registration and
 * from the preview part declared inside it.
 * @internal
 */
export interface ResolvedDragPreview {
  offset: DraggablePreviewOffset | undefined;
  modifiers: DraggableRootModifiers | undefined;
  /** Already resolved to an element; `null` injects the preview in place. */
  container: HTMLElement | null;
  disabled: boolean;
  /** React content for a host preview; `null` for a clone of the source. */
  render: ((parameters: DraggablePreviewRenderParameters<any>) => React.ReactNode) | null;
}

/**
 * Read the drag's preview settings, once, at drag start — the engine builds the
 * preview element synchronously from here, before React can run.
 *
 * A declared part describes the preview completely and does not merge with the
 * registration's `preview`, which only an imperative registration can set.
 * @internal
 */
export function resolveDragPreview(
  parameters: DraggableConfig<any, any>,
  source: HTMLElement,
): ResolvedDragPreview {
  const declaration = parameters.getDragPreviewDeclaration?.() ?? null;
  const settings = declaration ? declaration.getSettings() : parameters.preview;
  const render = (declaration ? declaration.render : parameters.preview?.render) ?? null;
  const disabled = settings?.disabled ?? false;

  // With no explicit container, the preview is inserted into the source's parent.
  const container = settings?.container;

  return {
    offset: settings?.offset,
    modifiers: settings?.modifiers,
    // Can be a callback, so leave it uninvoked when the preview is disabled.
    container: disabled ? null : resolveElementReference(container, source),
    disabled,
    render,
  };
}

/**
 * Resolve a `DraggablePreviewOffset` (the `'source'`/`'pointer'` presets, a fixed
 * `DraggablePosition`, or a callback) into a concrete pointer-relative offset.
 *
 * Defaults to `'source'`: the preview keeps the grab point it was picked up by,
 * so a cloned preview lifts off the element without shifting.
 */
export function resolveDragPreviewOffset(
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
  settings: ResolvedDragPreview,
  input: DraggableInput,
  pressInput: DraggableInput,
): void {
  if (settings.disabled) {
    return;
  }

  const previewElement = createDragPreviewElement(
    element,
    settings.container,
    settings.render === null,
  );
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
      // untransformed box the clone is anchored on (see `createDragPreviewElement`),
      // not the transformed one `getBoundingClientRect` reports, so the clone lifts off
      // exactly where the source sits.
      sourceRect: previewElement.sourceRect,
      input: isSourceOffset ? pressInput : input,
    });
  }
  preview.setPreviewOffset(offset);
}
