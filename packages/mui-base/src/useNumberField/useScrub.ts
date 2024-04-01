import * as React from 'react';
import * as ReactDOM from 'react-dom';
import type { UseNumberFieldReturnValue } from './useNumberField.types';
import { ownerDocument, ownerWindow } from '../utils/owner';
import { useLatestRef } from '../utils/useLatestRef';
import { isWebKit } from '../utils/detectBrowser';
import { DEFAULT_STEP } from './constants';
import { ScrubHandle, ScrubParams } from './useScrub.types';
import { getViewportRect, subscribeToVisualViewportResize } from './utils';

/**
 * @ignore - internal hook.
 */
export function useScrub(params: ScrubParams) {
  const { disabled, readOnly, value, inputRef, incrementValue, getStepAmount } = params;

  const latestValueRef = useLatestRef(value);

  const scrubHandleRef = React.useRef<ScrubHandle>(null);
  const scrubAreaRef = React.useRef<HTMLSpanElement>(null);

  const avoidFlickerTimeoutRef = React.useRef(-1);
  const isScrubbingRef = React.useRef(false);
  const scrubAreaCursorRef = React.useRef<HTMLSpanElement>(null);
  const virtualCursorCoords = React.useRef({ x: 0, y: 0 });
  const visualScaleRef = React.useRef(1);
  const unsubscribeVisualViewportResizeRef = React.useRef<() => void>(() => {});

  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [cursorStyles, setCursorStyles] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    return () => {
      clearTimeout(avoidFlickerTimeoutRef.current);
    };
  }, []);

  const onScrub = React.useCallback(({ movementX, movementY }: PointerEvent) => {
    const virtualCursor = scrubAreaCursorRef.current;
    const scrubAreaEl = scrubAreaRef.current;
    const scrubHandle = scrubHandleRef.current;

    if (!virtualCursor || !scrubAreaEl || !scrubHandle) {
      return;
    }

    const rect = getViewportRect(scrubHandle.teleportDistance, scrubAreaEl);

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

    setCursorStyles({
      transform: `translate3d(${newCoords.x}px,${newCoords.y}px,0) scale(${1 / visualScaleRef.current})`,
    });
  }, []);

  const onScrubbingChange = React.useCallback(
    (scrubbingValue: boolean, { clientX, clientY }: PointerEvent) => {
      ReactDOM.flushSync(() => {
        setIsScrubbing(scrubbingValue);
      });

      const virtualCursor = scrubAreaCursorRef.current;
      if (!virtualCursor || !scrubbingValue) {
        return;
      }

      unsubscribeVisualViewportResizeRef.current = subscribeToVisualViewportResize(
        virtualCursor,
        visualScaleRef,
      );

      const initialCoords = {
        x: clientX - virtualCursor.offsetWidth / 2,
        y: clientY - virtualCursor.offsetHeight / 2,
      };

      virtualCursorCoords.current = initialCoords;

      setCursorStyles({
        transform: `translate3d(${initialCoords.x}px,${initialCoords.y}px,0) scale(${1 / visualScaleRef.current})`,
      });
    },
    [],
  );

  const getScrubAreaProps: UseNumberFieldReturnValue['getScrubAreaProps'] = React.useCallback(
    (externalProps = {}) => ({
      role: 'presentation',
      ['data-scrubbing' as string]: isScrubbing || undefined,
      ...externalProps,
      style: {
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        ...externalProps.style,
      },
      onPointerDown(event) {
        externalProps.onPointerDown?.(event);
        const isMainButton = !event.button || event.button === 0;
        if (event.defaultPrevented || readOnly || !isMainButton || disabled) {
          return;
        }

        if (event.pointerType === 'mouse') {
          event.preventDefault();
          inputRef.current?.focus();
        }

        isScrubbingRef.current = true;
        onScrubbingChange(true, event.nativeEvent);

        // WebKit causes significant layout shift with the native message, so we can't use it.
        if (!isWebKit()) {
          // There can be some frames where there's no cursor at all when requesting the pointer lock.
          // This is a workaround to avoid flickering.
          avoidFlickerTimeoutRef.current = window.setTimeout(() => {
            ownerDocument(scrubAreaRef.current).body.requestPointerLock?.();
          }, 20);
        }
      },
    }),
    [readOnly, disabled, onScrubbingChange, inputRef, isScrubbing],
  );

  const getScrubAreaCursorProps: UseNumberFieldReturnValue['getScrubAreaCursorProps'] =
    React.useCallback(
      (externalProps = {}) => ({
        role: 'presentation',
        ...externalProps,
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 2147483647, // max z-index
          ...cursorStyles,
          ...externalProps.style,
          transform: `${cursorStyles.transform} ${externalProps.style?.transform || ''}`,
        },
      }),
      [cursorStyles],
    );

  React.useEffect(
    function registerGlobalScrubbingEventListeners() {
      if (!inputRef.current || disabled || readOnly) {
        return undefined;
      }

      let cumulativeDelta = 0;

      function handleScrubPointerUp(event: PointerEvent) {
        clearTimeout(avoidFlickerTimeoutRef.current);

        isScrubbingRef.current = false;

        onScrubbingChange(false, event);

        if (!isWebKit()) {
          ownerDocument(scrubAreaRef.current).exitPointerLock?.();
        }
      }

      function handleScrubPointerMove(event: PointerEvent) {
        if (!isScrubbingRef.current || !scrubHandleRef.current) {
          return;
        }

        // Prevent text selection.
        event.preventDefault();

        onScrub(event);

        const { direction, pixelSensitivity } = scrubHandleRef.current;
        const { movementX, movementY } = event;

        cumulativeDelta += direction === 'vertical' ? movementY : movementX;

        if (Math.abs(cumulativeDelta) >= pixelSensitivity) {
          cumulativeDelta = 0;
          const dValue = direction === 'vertical' ? -movementY : movementX;
          incrementValue(dValue * (getStepAmount() ?? DEFAULT_STEP), 1);
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

  return React.useMemo(
    () => ({
      isScrubbing,
      getScrubAreaProps,
      getScrubAreaCursorProps,
      scrubAreaCursorRef,
      scrubAreaRef,
      scrubHandleRef,
    }),
    [isScrubbing, getScrubAreaProps, getScrubAreaCursorProps],
  );
}
