import type * as React from 'react';
import type { DraggableConfig } from '../draggable';
import { resolveElementReference } from '../utils';
import type { DragModifiers, DragPreviewOffset, DragPreviewRenderEvent } from '../../../types/drag';
import {
  createClonedDragPreviewElement,
  createDragPreviewHostElement,
  type DragPreviewElementFactory,
} from './cloneDragPreview';

interface ResolvedDragPreviewBase {
  offset: DragPreviewOffset | undefined;
  modifiers: DragModifiers | undefined;
  /** Already resolved to an element; `null` injects the preview in place. */
  container: HTMLElement | null;
  disabled: boolean;
  createPreviewElement: DragPreviewElementFactory | null;
}

/**
 * The preview one drag will use, resolved from the draggable's registration and
 * from the preview part declared inside it.
 * @internal
 */
export type ResolvedDragPreview<TData = unknown> = ResolvedDragPreviewBase &
  (
    | { content: 'clone'; render: null }
    | {
        content: 'host';
        render: (parameters: DragPreviewRenderEvent<TData>) => React.ReactNode;
      }
  );

/**
 * Read the drag's preview settings, once, at drag start — the engine builds the
 * preview element synchronously from here, before React can run.
 *
 * A declared part describes the preview completely and does not merge with the
 * registration's `dragPreview`, which only an imperative registration can set.
 * @internal
 */
export function resolveDragPreview<TData = unknown>(
  parameters: DraggableConfig<TData>,
  source: HTMLElement,
): ResolvedDragPreview<TData> {
  const declaration = parameters.getDragPreviewDeclaration?.() ?? null;
  const settings = declaration ?? parameters.dragPreview;
  const render = settings?.render ?? null;
  const disabled = settings?.disabled ?? false;
  const createPreviewElement =
    declaration?.createPreviewElement ??
    (render ? createDragPreviewHostElement : createClonedDragPreviewElement);

  // A part's (or an imperative source's) own container wins over the subtree
  // default a `Draggable.PreviewProvider` set; with neither, the engine injects
  // the preview into the source's own parent.
  const container = settings?.container ?? parameters.previewContainerDefault;

  const base: ResolvedDragPreviewBase = {
    offset: settings?.offset,
    modifiers: settings?.modifiers,
    // Can be a callback, so leave it uninvoked when the preview is disabled.
    container: disabled ? null : resolveElementReference(container, source),
    disabled,
    createPreviewElement: disabled ? null : createPreviewElement,
  };

  if (render) {
    return { ...base, content: 'host', render };
  }
  return { ...base, content: 'clone', render: null };
}
