'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { styleHookMapping } from '../utils/styleHooks';
import { NumberFieldScrubAreaContext } from './NumberFieldScrubAreaContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { ownerDocument, ownerWindow } from '../../utils/owner';
import { isWebKit } from '../../utils/detectBrowser';
import { useLatestRef } from '../../utils/useLatestRef';
import { getViewportRect } from '../utils/getViewportRect';
import { subscribeToVisualViewportResize } from '../utils/subscribeToVisualViewportResize';
import { useEventCallback } from '../../utils/useEventCallback';
import { DEFAULT_STEP } from '../utils/constants';

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
    ...elementProps
  } = componentProps;

  const { state } = useNumberFieldRootContext();

  const {
    isScrubbing,
    setIsScrubbing,
    disabled,
    readOnly,
    value,
    inputRef,
    incrementValue,
    getStepAmount,
  } = useNumberFieldRootContext();

  const latestValueRef = useLatestRef(value);

  const scrubAreaRef = React.useRef<HTMLSpanElement>(null);

  const isScrubbingRef = React.useRef(false);
  const scrubAreaCursorRef = React.useRef<HTMLSpanElement>(null);
  const virtualCursorCoords = React.useRef({ x: 0, y: 0 });
  const visualScaleRef = React.useRef(1);

  const [isTouchInput, setIsTouchInput] = React.useState(false);
  const [isPointerLockDenied, setIsPointerLockDenied] = React.useState(false);

  React.useEffect(() => {
    if (!isScrubbing || !scrubAreaCursorRef.current) {
      return undefined;
    }

    return subscribeToVisualViewportResize(scrubAreaCursorRef.current, visualScaleRef);
  }, [isScrubbing]);

  const updateCursorTransform = useEventCallback((x: number, y: number) => {
    if (scrubAreaCursorRef.current) {
      scrubAreaCursorRef.current.style.transform = `translate3d(${x}px,${y}px,0) scale(${1 / visualScaleRef.current})`;
    }
  });

  const onScrub = React.useCallback(
    ({ movementX, movementY }: PointerEvent) => {
      const virtualCursor = scrubAreaCursorRef.current;
      const scrubAreaEl = scrubAreaRef.current;

      if (!virtualCursor || !scrubAreaEl) {
        return;
      }

      const rect = getViewportRect(teleportDistance, scrubAreaEl);

      const coords = virtualCursorCoords.current;
      const newCoords = {
        x: Math.round(coords.x + movementX),
        y: Math.round(coords.y + movementY),
      };

      const cursorWidth = virtualCursor.offsetWidth;
      const cursorHeight = virtualCursor.offsetHeight;

      if (newCoords.x + cursorWidth / 2 < rect.x) {
        newCoords.x = rect.width - cursorWidth / 2;
      } else if (newCoords.x + cursorWidth / 2 > rect.width) {
        newCoords.x = rect.x - cursorWidth / 2;
      }

      if (newCoords.y + cursorHeight / 2 < rect.y) {
        newCoords.y = rect.height - cursorHeight / 2;
      } else if (newCoords.y + cursorHeight / 2 > rect.height) {
        newCoords.y = rect.y - cursorHeight / 2;
      }

      virtualCursorCoords.current = newCoords;

      updateCursorTransform(newCoords.x, newCoords.y);
    },
    [teleportDistance, updateCursorTransform],
  );

  const onScrubbingChange = React.useCallback(
    (scrubbingValue: boolean, { clientX, clientY }: PointerEvent) => {
      ReactDOM.flushSync(() => {
        setIsScrubbing(scrubbingValue);
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
    [setIsScrubbing, updateCursorTransform],
  );

  React.useEffect(
    function registerGlobalScrubbingEventListeners() {
      if (!inputRef.current || disabled || readOnly) {
        return undefined;
      }

      let cumulativeDelta = 0;

      function handleScrubPointerUp(event: PointerEvent) {
        try {
          // Avoid errors in testing environments.
          ownerDocument(scrubAreaRef.current).exitPointerLock();
        } catch {
          //
        } finally {
          isScrubbingRef.current = false;
          onScrubbingChange(false, event);
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
          const dValue = direction === 'vertical' ? -movementY : movementX;
          incrementValue(dValue * (getStepAmount(event) ?? DEFAULT_STEP), 1);
        }
      }

      const win = ownerWindow(inputRef.current);

      win.addEventListener('pointerup', handleScrubPointerUp, true);
      win.addEventListener('pointermove', handleScrubPointerMove, true);

      return () => {
        win.removeEventListener('pointerup', handleScrubPointerUp, true);
        win.removeEventListener('pointermove', handleScrubPointerMove, true);
      };
    },
    [
      disabled,
      readOnly,
      incrementValue,
      latestValueRef,
      getStepAmount,
      inputRef,
      onScrubbingChange,
      onScrub,
      direction,
      pixelSensitivity,
    ],
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

      element.addEventListener('touchstart', handleTouchStart);

      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
      };
    },
    [disabled, readOnly],
  );

  const defaultProps: HTMLProps = {
    role: 'presentation',
    style: {
      touchAction: 'none',
      WebkitUserSelect: 'none',
      userSelect: 'none',
    },
    async onPointerDown(event) {
      const isMainButton = !event.button || event.button === 0;
      if (event.defaultPrevented || readOnly || !isMainButton || disabled) {
        return;
      }

      const isTouch = event.pointerType === 'touch';
      setIsTouchInput(isTouch);

      if (event.pointerType === 'mouse') {
        event.preventDefault();
        inputRef.current?.focus();
      }

      isScrubbingRef.current = true;
      onScrubbingChange(true, event.nativeEvent);

      // WebKit causes significant layout shift with the native message, so we can't use it.
      if (!isTouch && !isWebKit) {
        try {
          // Avoid non-deterministic errors in testing environments. This error sometimes
          // appears:
          // "The root document of this element is not valid for pointer lock."
          await ownerDocument(scrubAreaRef.current).body.requestPointerLock();
          setIsPointerLockDenied(false);
        } catch (error) {
          setIsPointerLockDenied(true);
        } finally {
          ReactDOM.flushSync(() => {
            onScrubbingChange(true, event.nativeEvent);
          });
        }
      }
    },
  };

  const element = useRenderElement('span', componentProps, {
    ref: [forwardedRef, scrubAreaRef],
    state,
    props: [defaultProps, elementProps],
    customStyleHookMapping: styleHookMapping,
  });

  const contextValue: NumberFieldScrubAreaContext = React.useMemo(
    () => ({
      isScrubbing,
      isTouchInput,
      isPointerLockDenied,
      scrubAreaCursorRef,
      scrubAreaRef,
      direction,
      pixelSensitivity,
      teleportDistance,
    }),
    [isScrubbing, isTouchInput, isPointerLockDenied, direction, pixelSensitivity, teleportDistance],
  );

  return (
    <NumberFieldScrubAreaContext.Provider value={contextValue}>
      {element}
    </NumberFieldScrubAreaContext.Provider>
  );
});

export namespace NumberFieldScrubArea {
  export interface State extends NumberFieldRoot.State {}

  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Cursor movement direction in the scrub area.
     * @default 'horizontal'
     */
    direction?: 'horizontal' | 'vertical';
    /**
     * Determines how many pixels the cursor must move before the value changes.
     * A higher value will make scrubbing less sensitive.
     * @default 2
     */
    pixelSensitivity?: number;
    /**
     * If specified, determines the distance that the cursor may move from the center
     * of the scrub area before it will loop back around.
     */
    teleportDistance?: number | undefined;
  }
}
