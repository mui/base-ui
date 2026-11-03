'use client';
import * as React from 'react';
import { inertValue } from '@base-ui/utils/inertValue';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { DragPreview } from '../../utils/drag-and-drop/synthetic/syntheticPreview';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { PREVIEW_ELEMENT_ATTRIBUTE } from '../../utils/drag-and-drop/utils';
import type { DraggableInput, DraggablePosition } from '../DraggableProvider';
import type { DraggableRootModifiers } from '../root/DraggableRoot';
import { useRootPreview } from '../root/DraggableRootContext';
import { DraggablePositionerContext } from './DraggablePositionerContext';

/**
 * Moves the drag preview with the pointer. Renders only while its item is dragged,
 * and until the preview settles after the drop.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable)
 */
export const DraggablePositioner = React.forwardRef(function DraggablePositioner(
  componentProps: DraggablePositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { offset, modifiers, className, render, style, ...elementProps } = componentProps;
  const preview = useRootPreview();

  const elementRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLElement | null>(null);
  const attachedRef = React.useRef<{
    preview: DragPreview;
    element: HTMLElement;
    content: HTMLElement | null;
    detach: () => void;
  } | null>(null);

  // Attach the element to the preview of the drag it renders for, which the engine then
  // moves. Runs from the refs and after every commit, since a new drag from the same item
  // can start before the element unmounts. The `Draggable.Preview` inside attaches its
  // ref first.
  const sync = useStableCallback((element: HTMLElement | null) => {
    const content = contentRef.current;
    const attached = attachedRef.current;
    if (attached?.element === element && attached.preview === preview) {
      // The `Draggable.Preview` mounted, unmounted, or rendered a new element.
      if (element && attached.content !== content) {
        attached.content = content;
        preview.setContent(element, content);
      }
      return;
    }
    attached?.detach();
    attachedRef.current = null;
    if (element && preview) {
      attachedRef.current = {
        preview,
        element,
        content,
        detach: preview.attach(element, content, { offset, modifiers }),
      };
    }
  });
  const ref = useRefWithInit(() => (element: HTMLElement | null) => {
    elementRef.current = element;
    sync(element);
  }).current;
  const contextValue: DraggablePositionerContext = useRefWithInit(() => ({
    previewRef(content: HTMLElement | null) {
      contentRef.current = content;
      sync(elementRef.current);
    },
  })).current;
  useIsoLayoutEffect(() => {
    sync(elementRef.current);
  });

  const element = useRenderElement('div', componentProps, {
    enabled: preview !== null,
    ref: [forwardedRef, ref],
    props: [
      {
        [PREVIEW_ELEMENT_ATTRIBUTE as string]: '',
        'aria-hidden': true,
        inert: inertValue(true),
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          margin: 0,
          // Hit-testing must see through the preview to the drop targets below.
          pointerEvents: 'none',
        },
      },
      elementProps,
    ],
  });

  if (preview === null) {
    return null;
  }
  return (
    <DraggablePositionerContext.Provider value={contextValue}>
      {element}
    </DraggablePositionerContext.Provider>
  );
});

export interface DraggablePositionerState {}

/** Parameters passed to a `Draggable.Positioner`'s `offset` callback. */
export interface DraggablePositionerOffsetParameters {
  /** The `Draggable.Preview` element, rendered so that it has a size. */
  element: HTMLElement;
  /** The trigger's bounding rect at drag start, in client coordinates. */
  sourceRect: DOMRect;
  /** Pointer state at drag start. */
  input: DraggableInput;
}

/**
 * Where the drag preview sits relative to the pointer.
 * - `'source'`: The preview lifts off the trigger without shifting.
 * - `'pointer'`: The preview's top-left corner sits under the pointer.
 * - `DraggablePosition`: A fixed offset from the preview's top-left corner to the pointer, in CSS pixels.
 * - `function`: Called when the preview first renders. Returns the offset.
 */
export type DraggablePositionerOffset =
  | DraggablePosition
  | 'source'
  | 'pointer'
  | ((parameters: DraggablePositionerOffsetParameters) => DraggablePosition);

export interface DraggablePositionerProps extends BaseUIComponentProps<
  'div',
  DraggablePositionerState
> {
  /**
   * Where the preview sits relative to the pointer. Positions refer to the
   * `Draggable.Preview` inside the positioner. Read when the preview first renders.
   * @default 'source'
   */
  offset?: DraggablePositionerOffset | undefined;
  /**
   * One or more modifiers that constrain the preview only. The drop position still
   * follows the pointer. To constrain the drag itself, use `modifiers` on `Draggable.Root`.
   * Read when the preview first renders.
   */
  modifiers?: DraggableRootModifiers | undefined;
}

export namespace DraggablePositioner {
  export type State = DraggablePositionerState;
  export type Props = DraggablePositionerProps;
  export type Offset = DraggablePositionerOffset;
  export type OffsetParameters = DraggablePositionerOffsetParameters;
}
