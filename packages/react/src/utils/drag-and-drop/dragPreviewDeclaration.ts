import { warn } from '@base-ui/utils/warn';
import type * as React from 'react';
import type {
  DraggablePreviewParameters,
  DraggablePreviewSettings,
  DraggablePreviewRenderParameters,
} from '../../draggable/preview/DraggablePreview';

/**
 * What a mounted preview part tells its draggable. The part renders nothing in
 * place. It only declares the preview, which the engine resolves once at drag
 * start and the overlay renders. This lets the preview outlive the source
 * component when a virtualizer or a live reorder unmounts it mid-drag.
 */
export interface DragPreviewDeclaration<TPayload = unknown, TDragData = unknown> {
  /** The part's current preview settings, read once at drag start. */
  getSettings: () => DraggablePreviewSettings;
  /**
   * Resolves the preview content at drag start. Returning `null` or `false`
   * declines the preview for this drag.
   *
   * `render: null` declares a clone of the source, which the engine builds without React.
   * Read synchronously at drag start, before React can run, which is why the
   * choice lives here instead of being signaled by mounting.
   */
  render:
    ((parameters: DraggablePreviewRenderParameters<TPayload, TDragData>) => React.ReactNode) | null;
}

/**
 * The link between a draggable and the preview part rendered inside it. Its identity
 * is stable for the draggable's lifetime, so it can be passed through context
 * without re-registering.
 */
export interface DragPreviewHandle<TPayload = unknown, TDragData = unknown> {
  /**
   * Publish a declaration and return its cleanup. The cleanup checks identity, so
   * a Strict Mode remount cannot clear a declaration it did not install.
   * @internal
   */
  declare: (declaration: DragPreviewDeclaration<TPayload, TDragData>) => () => void;
  /**
   * The declared preview as the engine's `preview` option. Each field reads the
   * current declaration, so the engine resolves the part mounted at drag start.
   * Without one, every field is `undefined` and the engine clones the source.
   * @internal
   */
  preview: DraggablePreviewParameters<TPayload, TDragData>;
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
          // Warn instead of throwing, like a duplicate `Draggable.Handle`. A wrapper
          // that composes its own clone preview around a consumer-passed `Preview` is
          // a plausible mistake, and crashing the app over it is out of proportion.
          // The last declaration wins, so the outcome is deterministic.
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
    preview: {
      get offset() {
        return current?.getSettings().offset;
      },
      get modifiers() {
        return current?.getSettings().modifiers;
      },
      get disabled() {
        return current?.getSettings().disabled;
      },
      get container() {
        return current?.getSettings().container;
      },
      get render() {
        return current?.render ?? undefined;
      },
    },
  };
}
