import { warn } from '@base-ui/utils/warn';
import type * as React from 'react';
import type { DragPreviewSettings, DragPreviewRenderEvent } from '../../types/drag';

/**
 * What a mounted preview part tells its draggable. The parts render nothing in
 * place — they only declare the preview, which the engine resolves once at drag
 * start and the overlay renders. That indirection is what lets the preview outlive
 * the source component when a virtualizer or a live reorder unmounts it mid-drag.
 */
export interface DragPreviewDeclaration<TData = unknown> extends DragPreviewSettings {
  /**
   * Resolves the preview content at drag start. Returning `null` or `false`
   * declines the preview for this drag.
   *
   * `null` declares a clone of the source, which the engine builds without React.
   * Read synchronously at drag start, before React can run — which is why the
   * choice lives here rather than being signalled by mounting.
   */
  render: ((parameters: DragPreviewRenderEvent<TData>) => React.ReactNode) | null;
}

/**
 * The link between a draggable and the preview part rendered inside it. Identity is
 * stable for the draggable's lifetime, so it can be carried on context without ever
 * re-registering anything.
 */
export interface DragPreviewHandle<TData = unknown> {
  /**
   * Publish a declaration and return its cleanup. The cleanup is identity-guarded
   * so a Strict Mode remount cannot clear a declaration it did not install.
   * @internal
   */
  declare: (declaration: DragPreviewDeclaration<TData>) => () => void;
  /** @internal */
  getDeclaration: () => DragPreviewDeclaration<TData> | null;
}

export function createDragPreviewHandle<TData = unknown>(): DragPreviewHandle<TData> {
  let current: DragPreviewDeclaration<TData> | null = null;
  return {
    declare(declaration) {
      if (process.env.NODE_ENV !== 'production') {
        if (current !== null) {
          // Warn rather than throw, matching the duplicate-`Draggable.Handle`
          // mistake: a wrapper component composing its own `ClonedPreview` around a
          // consumer-passed `Preview` is a plausible mistake, and white-screening
          // production over it is out of proportion. Last declaration wins, which
          // at least makes the outcome deterministic.
          warn(
            'Base UI: a Draggable.Root contains more than one preview part. ' +
              'A draggable has one preview, so the last one mounted wins and the others are ignored. ' +
              'Keep either the Draggable.Preview that renders your own content, or the ' +
              'Draggable.ClonedPreview that configures the clone of the source. ' +
              'See https://base-ui.com/react/components/draggable',
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
