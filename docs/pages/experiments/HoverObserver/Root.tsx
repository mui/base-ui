import * as React from 'react';

type ElementPosition = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

interface HoverObserverContextValue {
  onElementHover: (element: HTMLElement | null) => void;
  lastHoveredElementPosition: ElementPosition | null;
}

export const HoverObserverContext = React.createContext<HoverObserverContextValue | null>(null);

export default function HoverObserverRoot(props: React.ComponentPropsWithRef<'div'>) {
  const [lastHoveredElementPosition, setLastHoveredElementPosition] =
    React.useState<ElementPosition | null>(null);

  const rootElement = React.useRef<HTMLDivElement>(null);

  const onElementHover = React.useCallback((element: HTMLElement | null) => {
    if (!element) {
      setLastHoveredElementPosition(null);
      return;
    }

    const {
      left: rootLeft,
      right: rootRight,
      top: rootTop,
      bottom: rootBottom,
    } = rootElement.current!.getBoundingClientRect();

    const {
      left: elementLeft,
      right: elementRight,
      top: elementTop,
      bottom: elementBottom,
      width,
      height,
    } = element.getBoundingClientRect();

    const left = elementLeft - rootLeft;
    const right = rootRight - elementRight;
    const top = elementTop - rootTop;
    const bottom = rootBottom - elementBottom;

    setLastHoveredElementPosition((previous) => {
      if (
        previous &&
        previous.left === left &&
        previous.right === right &&
        previous.top === top &&
        previous.bottom === bottom &&
        previous.width === width &&
        previous.height === height
      ) {
        return previous;
      }

      return { left, right, top, bottom, width, height };
    });
  }, []);

  const handleMouseOut = React.useCallback((event: React.MouseEvent) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    setLastHoveredElementPosition(null);
  }, []);

  const contextValue = React.useMemo(
    () => ({ onElementHover, lastHoveredElementPosition }),
    [onElementHover, lastHoveredElementPosition],
  );

  return (
    // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
    <div {...props} ref={rootElement} onMouseOut={handleMouseOut}>
      <HoverObserverContext.Provider value={contextValue}>
        {props.children}
      </HoverObserverContext.Provider>
    </div>
  );
}
