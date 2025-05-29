'use client';
import * as React from 'react';
import type { ElementProps, FloatingRootContext } from '@floating-ui/react';
import { isMouseLikePointerType } from '@floating-ui/react/utils';
import { useAnimationFrame } from '../useAnimationFrame';

const EMPTY_OBJECT = {};

export interface UseClickProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean;
  /**
   * The type of event to use to determine a “click” with mouse input.
   * Keyboard clicks work as normal.
   * @default 'click'
   */
  event?: 'click' | 'mousedown';
  /**
   * Whether to toggle the open state with repeated clicks.
   * @default true
   */
  toggle?: boolean;
  /**
   * Whether to ignore the logic for mouse input (for example, if `useHover()`
   * is also being used).
   * @default false
   */
  ignoreMouse?: boolean;
  /**
   * If already open from another event such as the `useHover()` Hook,
   * determines whether to keep the floating element open when clicking the
   * reference element for the first time.
   * @default true
   */
  stickIfOpen?: boolean;
}

/**
 * Opens or closes the floating element when clicking the reference element.
 * @see https://floating-ui.com/docs/useClick
 */
export function useClick(context: FloatingRootContext, props: UseClickProps = {}): ElementProps {
  const { open, onOpenChange, dataRef } = context;
  const {
    enabled = true,
    event: eventOption = 'click',
    toggle = true,
    ignoreMouse = false,
    stickIfOpen = true,
  } = props;

  const pointerTypeRef = React.useRef<'mouse' | 'pen' | 'touch'>(undefined);
  const frame = useAnimationFrame();

  const reference: ElementProps['reference'] = React.useMemo(
    () => ({
      onPointerDown(event) {
        pointerTypeRef.current = event.pointerType;
      },
      onMouseDown(event) {
        const pointerType = pointerTypeRef.current;
        const nativeEvent = event.nativeEvent;

        // Ignore all buttons except for the "main" button.
        // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
        if (
          event.button !== 0 ||
          eventOption === 'click' ||
          (isMouseLikePointerType(pointerType, true) && ignoreMouse)
        ) {
          return;
        }

        const nextOpen = !(
          open &&
          toggle &&
          (dataRef.current.openEvent && stickIfOpen
            ? dataRef.current.openEvent.type === 'click' ||
              dataRef.current.openEvent.type === 'mousedown'
            : true)
        );
        // Wait until focus is set on the element. This is an alternative to
        // `event.preventDefault()` to avoid :focus-visible from appearing when using a pointer.
        frame.request(() => {
          onOpenChange(nextOpen, nativeEvent, 'click');
        });
      },
      onClick(event) {
        const pointerType = pointerTypeRef.current;

        if (eventOption === 'mousedown' && pointerType) {
          pointerTypeRef.current = undefined;
          return;
        }

        if (isMouseLikePointerType(pointerType, true) && ignoreMouse) {
          return;
        }

        const nextOpen = !(
          open &&
          toggle &&
          (dataRef.current.openEvent && stickIfOpen
            ? dataRef.current.openEvent.type === 'click' ||
              dataRef.current.openEvent.type === 'mousedown'
            : true)
        );
        onOpenChange(nextOpen, event.nativeEvent, 'click');
      },
      onKeyDown() {
        pointerTypeRef.current = undefined;
      },
    }),
    [dataRef, eventOption, ignoreMouse, onOpenChange, open, stickIfOpen, toggle, frame],
  );

  return React.useMemo(() => (enabled ? { reference } : EMPTY_OBJECT), [enabled, reference]);
}
