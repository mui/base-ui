import type * as React from 'react';
import type { DraggableConfig } from '../draggable';
import { resolveElementReference } from '../utils';
import type {
  DragModifiers,
  DragPreviewOffset,
  DraggablePreviewRenderParameters,
} from '../../../types/drag';
import {
  createClonedDragPreviewElement,
  createDragPreviewHostElement,
  type DragPreviewElementFactory,
} from './cloneDragPreview';

/**
 * The preview one drag will use, resolved from the draggable's registration and
 * from the preview part declared inside it.
 * @internal
 */
export interface ResolvedDragPreview<TPayload = unknown> {
  offset: DragPreviewOffset | undefined;
  modifiers: DragModifiers | undefined;
  /** Already resolved to an element; `null` injects the preview in place. */
  container: HTMLElement | null;
  disabled: boolean;
  /** Builds the element the engine moves; never read when `disabled`. */
  createPreviewElement: DragPreviewElementFactory;
  /** React content for a host preview; `null` for a clone of the source. */
  render: ((parameters: DraggablePreviewRenderParameters<TPayload>) => React.ReactNode) | null;
}

/**
 * Read the drag's preview settings, once, at drag start — the engine builds the
 * preview element synchronously from here, before React can run.
 *
 * A declared part describes the preview completely and does not merge with the
 * registration's `preview`, which only an imperative registration can set.
 * @internal
 */
export function resolveDragPreview<TPayload = unknown>(
  parameters: DraggableConfig<TPayload>,
  source: HTMLElement,
): ResolvedDragPreview<TPayload> {
  const declaration = parameters.getDragPreviewDeclaration?.() ?? null;
  const settings = declaration ?? parameters.preview;
  const render = settings?.render ?? null;
  const disabled = settings?.disabled ?? false;
  const createPreviewElement =
    declaration?.createPreviewElement ??
    (render ? createDragPreviewHostElement : createClonedDragPreviewElement);

  // With no explicit container, the preview is inserted into the source's parent.
  const container = settings?.container;

  return {
    offset: settings?.offset,
    modifiers: settings?.modifiers,
    // Can be a callback, so leave it uninvoked when the preview is disabled.
    container: disabled ? null : resolveElementReference(container, source),
    disabled,
    createPreviewElement,
    render,
  };
}
