import { warn } from '@base-ui/utils/warn';
import type * as React from 'react';
import type {
  DraggablePreviewSettings,
  DraggablePreviewRenderParameters,
} from '../../draggable/preview/DraggablePreview';
import type { DragPreviewElementFactory } from './synthetic/cloneDragPreview';

/**
 * What a mounted preview part tells its draggable. The parts render nothing in
 * place — they only declare the preview, which the engine resolves once at drag
 * start and the overlay renders. That indirection is what lets the preview outlive
 * the source component when a virtualizer or a live reorder unmounts it mid-drag.
 */
export interface DragPreviewDeclaration<
  TPayload = unknown,
  TDragData = unknown,
> extends DraggablePreviewSettings {
  /** Builds the engine-owned preview element. @internal */
  createPreviewElement: DragPreviewElementFactory;
  /**
   * Resolves the preview content at drag start. Returning `null` or `false`
   * declines the preview for this drag.
   *
   * `null` declares a clone of the source, which the engine builds without React.
   * Read synchronously at drag start, before React can run — which is why the
   * choice lives here rather than being signalled by mounting.
   */
  render:
    ((parameters: DraggablePreviewRenderParameters<TPayload, TDragData>) => React.ReactNode) | null;
}

/**
 * The link between a draggable and the preview part rendered inside it. Identity is
 * stable for the draggable's lifetime, so it can be carried on context without ever
 * re-registering anything.
 */
export interface DragPreviewHandle<TPayload = unknown, TDragData = unknown> {
  /**
   * Publish a declaration and return its cleanup. The cleanup is identity-guarded
   * so a Strict Mode remount cannot clear a declaration it did not install.
   * @internal
   */
  declare: (declaration: DragPreviewDeclaration<TPayload, TDragData>) => () => void;
  /** @internal */
  getDeclaration: () => DragPreviewDeclaration<TPayload, TDragData> | null;
}

export function createDragPreviewHandle<
  TPayload = unknown,
  TDragData = unknown,
>(): DragPreviewHandle<TPayload, TDragData> {
  let current: DragPreviewDeclaration<TPayload, TDragData> | null = null;
  return {
    declare(declaration) {
      if (process.env.NODE_ENV !== 'production') {
        if (current !== null) {
          // Warn rather than throw, matching the duplicate-`Draggable.Handle`
          // mistake: a wrapper component composing its own clone preview around a
          // consumer-passed `Preview` is a plausible mistake, and white-screening
          // production over it is out of proportion. Last declaration wins, which
          // at least makes the outcome deterministic.
          warn(
            'A Draggable.Root contains more than one preview part. ' +
              'A draggable has one preview, so the last one mounted wins and the others are ignored. ' +
              'Keep one Draggable.Preview to configure the clone or render custom content. ' +
              'See https://base-ui.com/react/utils/draggable',
          );
        }
      }
      current = declaration;
      return () => {
        if (current === declaration) {
          current = null;
        }
      };
    },
    getDeclaration() {
      return current;
    },
  };
}
