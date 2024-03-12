import * as React from 'react';
import * as ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { useForkRef } from '../utils/useForkRef';
import { useNumberFieldContext } from './NumberFieldContext';
import type { NumberFieldScrubAreaProps } from './NumberField.types';
import { resolveClassName } from '../utils/resolveClassName';
import { ownerWindow } from '../utils/owner';
import { ScrubAreaContext } from './ScrubAreaContext';

function getViewportRect(teleportDistance: number | undefined, scrubAreaEl: HTMLElement) {
  const win = ownerWindow(scrubAreaEl);
  const rect = scrubAreaEl.getBoundingClientRect();

  if (rect && teleportDistance != null) {
    return {
      x: rect.left - teleportDistance / 2,
      y: rect.top - teleportDistance / 2,
      width: rect.right + teleportDistance / 2,
      height: rect.bottom + teleportDistance / 2,
    };
  }

  const vV = win.visualViewport;

  if (vV) {
    return {
      x: vV.offsetLeft,
      y: vV.offsetTop,
      width: vV.offsetLeft + vV.width,
      height: vV.offsetTop + vV.height,
    };
  }

  return {
    x: 0,
    y: 0,
    width: win.document.documentElement.clientWidth,
    height: win.document.documentElement.clientHeight,
  };
}

function defaultRender(props: React.ComponentPropsWithRef<'span'>) {
  return <span {...props} />;
}

/**
 *
 * Demos:
 *
 * - [NumberField](https://mui.com/base-ui/react-number-field/)
 *
 * API:
 *
 * - [NumberFieldScrubArea API](https://mui.com/base-ui/react-number-field/components-api/#number-field-scrub-area)
 */
const NumberFieldScrubArea = React.forwardRef(function NumberFieldScrubArea(
  props: NumberFieldScrubAreaProps,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const {
    direction = 'vertical',
    pixelSensitivity = 2,
    teleportDistance,
    render: renderProp,
    className,
    ...otherProps
  } = props;
  const render = renderProp ?? defaultRender;

  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [transform, setTransform] = React.useState('');

  const virtualCursorRef = React.useRef<HTMLSpanElement>(null);
  const virtualCursorCoords = React.useRef({ x: 0, y: 0 });
  // This only handles pinch-zoom, not the browser zoom. Detecting browser zoom is not possible
  // reliably.
  const visualScaleRef = React.useRef(1);
  const unsubscribeVisualViewportResizeRef = React.useRef<() => void>(() => {});

  const { getScrubAreaProps, scrubAreaRef, scrubHandleRef, ownerState } =
    useNumberFieldContext('ScrubArea');

  React.useEffect(() => {
    return () => {
      unsubscribeVisualViewportResizeRef.current();
    };
  }, []);

  // This lets us invert the scale of the cursor to match the OS scale, in which the cursor doesn't
  // scale with the content on pinch-zoom.
  function subscribeToVisualViewportResize(element: Element) {
    const vV = ownerWindow(element).visualViewport;

    if (!vV) {
      return () => {};
    }

    function handleVisualResize() {
      if (vV) {
        visualScaleRef.current = vV.scale;
      }
    }

    vV.addEventListener('resize', handleVisualResize);

    return () => {
      vV.removeEventListener('resize', handleVisualResize);
    };
  }

  React.useImperativeHandle(scrubHandleRef, () => ({
    direction,
    pixelSensitivity,
    onScrub({ movementX, movementY }) {
      const virtualCursor = virtualCursorRef.current;
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

      setTransform(
        `translate3d(${newCoords.x}px,${newCoords.y}px,0) scale(${1 / visualScaleRef.current})`,
      );
    },
    onScrubbingChange(scrubbingValue, { clientX, clientY }) {
      ReactDOM.flushSync(() => {
        setIsScrubbing(scrubbingValue);
      });

      const virtualCursor = virtualCursorRef.current;
      if (!virtualCursor || !scrubbingValue) {
        return;
      }

      unsubscribeVisualViewportResizeRef.current = subscribeToVisualViewportResize(virtualCursor);

      const initialCoords = {
        x: clientX - virtualCursor.offsetWidth / 2,
        y: clientY - virtualCursor.offsetHeight / 2,
      };

      virtualCursorCoords.current = initialCoords;

      setTransform(
        `translate3d(${initialCoords.x}px,${initialCoords.y}px,0) scale(${1 / visualScaleRef.current})`,
      );
    },
  }));

  const mergedRef = useForkRef(scrubAreaRef, forwardedRef);

  const scrubAreaProps = getScrubAreaProps({
    ref: mergedRef,
    className: resolveClassName(className, ownerState),
    ['data-scrubbing' as string]: isScrubbing || undefined,
    ...otherProps,
  });

  const contextValue = React.useMemo(
    () => ({
      isScrubbing,
      ownerState,
      virtualCursorRef,
      transform,
    }),
    [isScrubbing, ownerState, transform],
  );

  return (
    <ScrubAreaContext.Provider value={contextValue}>
      {render(scrubAreaProps, ownerState)}
    </ScrubAreaContext.Provider>
  );
});

NumberFieldScrubArea.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The direction that the scrub area should change the value.
   *
   * @default 'vertical'
   */
  direction: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * Determines the number of pixels the cursor must move before the value changes. A higher value
   * will make the scrubbing less sensitive.
   * @default 2
   */
  pixelSensitivity: PropTypes.number,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.func,
  /**
   * If specified, how much the cursor can move from the scrubbing starting point before the cursor
   * teleports back to the starting point.
   */
  teleportDistance: PropTypes.number,
} as any;

export { NumberFieldScrubArea };
