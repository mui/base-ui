import { warn } from '@base-ui/utils/warn';
import type { DraggablePreviewParameters, DraggablePreviewSettings } from './DraggablePreview';

/**
 * What a mounted `Draggable.Preview` tells its draggable. It renders nothing in place:
 * the engine resolves the declaration at drag start and the overlay renders it, so the
 * preview outlives a source that a virtualizer or a live reorder unmounts mid-drag.
 */
export interface DragPreviewDeclaration<TPayload = unknown, TDragData = unknown> {
  /** The part's current preview settings, read once at drag start. */
  getSettings: () => DraggablePreviewSettings;
  /**
   * Resolves the preview content at drag start. Returning `null` or `false` declines
   * the preview for this drag. `undefined` declares a clone, which the engine builds
   * without React. Read synchronously at drag start, before React can run, so the
   * choice can't be signaled by mounting.
   */
  render: DraggablePreviewParameters<TPayload, TDragData>['render'];
}

/**
 * Links a draggable to the `Draggable.Preview` inside it. Stable for the draggable's
 * lifetime, so passing it through context never re-registers anything.
 */
export interface DragPreviewHandle<TPayload = unknown, TDragData = unknown> {
  /**
   * Publishes a declaration and returns its cleanup. The cleanup only clears its own
   * declaration, so a stale part's late cleanup can't clear a newer one.
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
          // Warn rather than throw, like a duplicate `Draggable.Handle`. A wrapper adding
          // its own preview around a consumer's is a plausible mistake, and the last
          // declaration wins, so the outcome is deterministic.
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
        return current?.render;
      },
    },
  };
}
