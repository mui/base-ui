'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useDraggableRootContext } from '../root/DraggableRootContext';
import type { DragPreviewDeclaration } from '../../utils/drag-and-drop/dragPreviewDeclaration';
import type { DragPreviewSettings } from '../../types/drag';
import { useDragPreviewContext } from '../../utils/drag-and-drop/overlay/DragPreviewContext';
import { throwMissingPreviewProvider } from '../../utils/drag-and-drop/overlay/missingPreviewProvider';

/**
 * Tell the draggable what its preview is. Pass `render` to own the content, or
 * `null` for a clone of the source.
 * @internal
 */
export function useDeclaredPreview<TData = unknown>(
  propsRef: ReturnType<typeof useValueAsRef<DragPreviewSettings>>,
  render: DragPreviewDeclaration<TData>['render'],
): void {
  const { previewHandle, previewContext: rootPreviewContext } = useDraggableRootContext<TData>();
  const previewContext = useDragPreviewContext();

  // Content needs a React tree to render in. Fail here rather than at drag start,
  // so the stack points at the part that declared it. A `Draggable.ClonedPreview`
  // passes `null` and needs no provider — the engine clones without React.
  if (render !== null && previewContext === null) {
    throwMissingPreviewProvider();
  }
  // The engine publishes through the provider seen from the *root's* position. A
  // provider mounted between the root and this part passes the check above but is
  // not the one the content reaches — with none above the root, the drag would
  // throw mid-gesture at drag start instead of here.
  if (render !== null && previewContext !== rootPreviewContext) {
    throw new Error(
      'Base UI: the <Draggable.PreviewProvider> for this preview is inside its ' +
        '<Draggable.Root>, so the root cannot use it to render the preview. ' +
        'Move the provider above the <Draggable.Root>. ' +
        'See https://base-ui.com/react/components/draggable.',
    );
  }

  const declaration = React.useMemo<DragPreviewDeclaration<TData>>(() => {
    // `.next` is the current render's props (see `useRegistrationRef`).
    const latest = () => propsRef.next;
    // Mapped over `Required<…>` so every setting has to be plucked here: settings
    // are all optional, so a new one added to `DragPreviewSettings` would
    // otherwise type-check while being silently dropped on its way to the engine.
    const declared: {
      [K in keyof Required<DragPreviewDeclaration<TData>>]: DragPreviewDeclaration<TData>[K];
    } = {
      render,
      get offset() {
        return latest().offset;
      },
      get modifiers() {
        return latest().modifiers;
      },
      get disabled() {
        return latest().disabled;
      },
      get container() {
        return latest().container;
      },
    };
    return declared;
  }, [propsRef, render]);

  useIsoLayoutEffect(() => previewHandle.declare(declaration), [previewHandle, declaration]);
}
