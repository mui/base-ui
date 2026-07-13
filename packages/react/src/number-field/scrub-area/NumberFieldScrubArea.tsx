'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { ownerWindow, ownerDocument } from '@base-ui/utils/owner';
import { platform } from '@base-ui/utils/platform';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import type { NumberFieldRootState } from '../root/NumberFieldRoot';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';
import { NumberFieldScrubAreaContext } from './NumberFieldScrubAreaContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { getViewportRect } from '../utils/getViewportRect';
import { createGenericEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { getTarget } from '../../floating-ui-react/utils';

const SCRUB_AREA_STYLE: React.CSSProperties = {
  touchAction: 'none',
  WebkitUserSelect: 'none',
  userSelect: 'none',
};

/**
 * An interactive area where the user can click and drag to change the field value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldScrubArea = React.forwardRef(function NumberFieldScrubArea(
  componentProps: NumberFieldScrubArea.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const {
    render,
    className,
    direction = 'horizontal',
    pixelSensitivity = 2,
    teleportDistance,
    style,
    ...elementProps
  } = componentProps;

  const {
    state,
    setIsScrubbing: setRootScrubbing,
    inputRef,
    incrementValue,
    allowInputSyncRef,
    getStepAmount,
    onValueCommitted,
    lastChangedValueRef,
    valueRef,
  } = useNumberFieldRootContext();
  const { disabled, readOnly } = state;

  const scrubAreaRef = React.useRef<HTMLSpanElement>(null);

  const isScrubbingRef = React.useRef(false);
  const didMoveRef = React.useRef(false);
  const pointerDownTargetRef = React.useRef<EventTarget | null>(null);
  const scrubAreaCursorRef = React.useRef<HTMLSpanElement>(null);
  const virtualCursorCoords = React.useRef({ x: 0, y: 0 });

  const exitPointerLockTimeout = useTimeout();

  const [isTouchInput, setIsTouchInput] = React.useState(false);
  const [isPointerLockDenied, setIsPointerLockDenied] = React.useState(false);
  const [isScrubbing, setIsScrubbing] = React.useState(false);

  function updateCursorTransform(x: number, y: number) {
    const virtualCursor = scrubAreaCursorRef.current;
    if (virtualCursor) {
      // Invert the visual viewport scale so the cursor matches the OS cursor, which doesn't
      // scale with the content on pinch-zoom.
      const scale = ownerWindow(virtualCursor).visualViewport?.scale ?? 1;
      virtualCursor.style.transform = `translate3d(${x}px,${y}px,0) scale(${1 / scale})`;
    }
  }

  const onScrub = useStableCallback(({ movementX, movementY }: PointerEvent) => {
    const virtualCursor = scrubAreaCursorRef.current;
    const scrubAreaEl = scrubAreaRef.current;

    if (!virtualCursor || !scrubAreaEl) {
      return;
    }

    const rect = getViewportRect(teleportDistance, scrubAreaEl);

    const coords = virtualCursorCoords.current;

    // Wrap the cursor to the opposite edge when its center crosses a viewport bound.
    const wrap = (coord: number, halfSize: number, low: number, high: number) => {
      if (coord + halfSize < low) {
        return high - halfSize;
      }
      if (coord + halfSize > high) {
        return low - halfSize;
      }
      return coord;
    };

    const newCoords = {
      x: wrap(
        Math.round(coords.x + movementX),
        virtualCursor.offsetWidth / 2,
        rect.left,
        rect.right,
      ),
      y: wrap(
        Math.round(coords.y + movementY),
        virtualCursor.offsetHeight / 2,
        rect.top,
        rect.bottom,
      ),
    };

    virtualCursorCoords.current = newCoords;

    updateCursorTransform(newCoords.x, newCoords.y);
  });

  const onScrubbingChange = useStableCallback(
    (scrubbingValue: boolean, { clientX, clientY }: PointerEvent) => {
      ReactDOM.flushSync(() => {
        setIsScrubbing(scrubbingValue);
        setRootScrubbing(scrubbingValue);
      });

      const virtualCursor = scrubAreaCursorRef.current;
      if (!virtualCursor || !scrubbingValue) {
        return;
      }

      const initialCoords = {
        x: clientX - virtualCursor.offsetWidth / 2,
        y: clientY - virtualCursor.offsetHeight / 2,
      };

      virtualCursorCoords.current = initialCoords;

      updateCursorTransform(initialCoords.x, initialCoords.y);
    },
  );

  React.useEffect(
    function registerGlobalScrubbingEventListeners() {
      // Only listen while actively scrubbing; avoids unrelated pointerup events committing.
      if (!inputRef.current || disabled || readOnly || !isScrubbing) {
        return undefined;
      }

      let cumulativeDelta = 0;

      function handleScrubPointerUp(event: PointerEvent) {
        function handler() {
          try {
            ownerDocument(scrubAreaRef.current).exitPointerLock();
          } catch {
            // Ignore errors.
          } finally {
            isScrubbingRef.current = false;
            onScrubbingChange(false, event);
            onValueCommitted(
              lastChangedValueRef.current ?? valueRef.current,
              createGenericEventDetails(REASONS.scrub, event),
            );

            // Manually dispatch a click event if no movement happened, since
            // preventDefault on pointerdown prevents the browser click event.
            const pointerDownTarget = pointerDownTargetRef.current;
            const input = inputRef.current;
            if (!didMoveRef.current && pointerDownTarget != null && input) {
              pointerDownTarget.dispatchEvent(
                new (ownerWindow(input).MouseEvent)('click', {
                  bubbles: true,
                  cancelable: true,
                }),
              );
            }

            didMoveRef.current = false;
            pointerDownTargetRef.current = null;
          }
        }

        if (platform.engine.gecko) {
          // Firefox needs a small delay here when soft-clicking as the pointer
          // lock will not release otherwise.
          exitPointerLockTimeout.start(20, handler);
        } else {
          handler();
        }
      }

      function handleScrubPointerMove(event: PointerEvent) {
        if (!isScrubbingRef.current) {
          return;
        }

        // Prevent text selection.
        event.preventDefault();

        onScrub(event);

        const { movementX, movementY } = event;

        cumulativeDelta += direction === 'vertical' ? movementY : movementX;

        if (Math.abs(cumulativeDelta) >= pixelSensitivity) {
          cumulativeDelta = 0;
          didMoveRef.current = true;
          const dValue = direction === 'vertical' ? -movementY : movementX;
          const stepAmount = getStepAmount(event);
          const rawAmount = dValue * stepAmount;

          if (rawAmount !== 0) {
            allowInputSyncRef.current = true;
            incrementValue(Math.abs(rawAmount), {
              direction: rawAmount >= 0 ? 1 : -1,
              event,
              reason: REASONS.scrub,
            });
          }
        }
      }

      const win = ownerWindow(inputRef.current);
      const unsubscribe = mergeCleanups(
        addEventListener(win, 'pointerup', handleScrubPointerUp, true),
        addEventListener(win, 'pointermove', handleScrubPointerMove, true),
      );

      return () => {
        exitPointerLockTimeout.clear();
        unsubscribe();
      };
    },
    [
      disabled,
      readOnly,
      allowInputSyncRef,
      incrementValue,
      isScrubbing,
      getStepAmount,
      inputRef,
      onScrubbingChange,
      onScrub,
      direction,
      pixelSensitivity,
      lastChangedValueRef,
      onValueCommitted,
      valueRef,
      exitPointerLockTimeout,
    ],
  );

  // If the scrub area unmounts mid-scrub, release pointer lock and clear the root's scrubbing
  // state so it doesn't stay locked or stuck. (No commit: there's no pointer release here.)
  React.useEffect(
    () => () => {
      if (isScrubbingRef.current) {
        isScrubbingRef.current = false;
        setRootScrubbing(false);
        try {
          ownerDocument(scrubAreaRef.current).exitPointerLock();
        } catch {
          // Ignore errors.
        }
      }
    },
    [setRootScrubbing],
  );

  // Prevent scrolling using touch input when scrubbing.
  React.useEffect(
    function registerScrubberTouchPreventListener() {
      const element = scrubAreaRef.current;
      if (!element || disabled || readOnly) {
        return undefined;
      }

      function handleTouchStart(event: TouchEvent) {
        if (event.touches.length === 1) {
          event.preventDefault();
        }
      }

      return addEventListener(element, 'touchstart', handleTouchStart);
    },
    [disabled, readOnly],
  );

  const defaultProps: HTMLProps = {
    role: 'presentation',
    style: SCRUB_AREA_STYLE,
    async onPointerDown(event) {
      if (event.defaultPrevented || readOnly || event.button || disabled) {
        return;
      }

      const isTouch = event.pointerType === 'touch';
      setIsTouchInput(isTouch);

      if (event.pointerType === 'mouse') {
        event.preventDefault();
        inputRef.current?.focus();
      }

      isScrubbingRef.current = true;
      didMoveRef.current = false;
      pointerDownTargetRef.current = getTarget(event.nativeEvent);
      onScrubbingChange(true, event.nativeEvent);

      // WebKit causes significant layout shift with the native message, so we can't use it.
      if (!isTouch && !platform.engine.webkit) {
        try {
          // Avoid non-deterministic errors in testing environments. This error sometimes
          // appears:
          // "The root document of this element is not valid for pointer lock."
          await ownerDocument(scrubAreaRef.current).body.requestPointerLock();
          setIsPointerLockDenied(false);
        } catch (error) {
          setIsPointerLockDenied(true);
        } finally {
          // `onScrubbingChange` already wraps its state updates in `flushSync`, so re-emit the
          // scrubbing state directly (no extra nested `flushSync`) to reflect the resolved
          // pointer-lock result on the cursor.
          if (isScrubbingRef.current) {
            onScrubbingChange(true, event.nativeEvent);
          }
        }
      }
    },
  };

  const element = useRenderElement('span', componentProps, {
    ref: [forwardedRef, scrubAreaRef],
    state,
    props: [defaultProps, elementProps],
    stateAttributesMapping,
  });

  const contextValue: NumberFieldScrubAreaContext = React.useMemo(
    () => ({
      isScrubbing,
      isTouchInput,
      isPointerLockDenied,
      scrubAreaCursorRef,
    }),
    [isScrubbing, isTouchInput, isPointerLockDenied],
  );

  return (
    <NumberFieldScrubAreaContext.Provider value={contextValue}>
      {element}
    </NumberFieldScrubAreaContext.Provider>
  );
});

export interface NumberFieldScrubAreaState extends NumberFieldRootState {}

export interface NumberFieldScrubAreaProps extends BaseUIComponentProps<
  'span',
  NumberFieldScrubAreaState
> {
  /**
   * Cursor movement direction in the scrub area.
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical' | undefined;
  /**
   * Determines how many pixels the cursor must move before the value changes.
   * A higher value will make scrubbing less sensitive.
   * @default 2
   */
  pixelSensitivity?: number | undefined;
  /**
   * If specified, determines the distance that the cursor may move from the center
   * of the scrub area before it will loop back around.
   */
  teleportDistance?: number | undefined;
}

export namespace NumberFieldScrubArea {
  export type State = NumberFieldScrubAreaState;
  export type Props = NumberFieldScrubAreaProps;
}
