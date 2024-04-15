import * as React from 'react';
import { HoverObserverContext } from './Root';

interface HoverObserverContainerProps {
  observedElements?: 'directChildren' | string;
}

export default function HoverObserverContainer(
  props: React.ComponentPropsWithRef<'div'> & HoverObserverContainerProps,
) {
  const { observedElements = 'directChildren', ...other } = props;
  const { onElementHover } = React.useContext(HoverObserverContext)!;

  const handleMouseOver = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (e.target === e.currentTarget) {
        return;
      }

      if (
        (observedElements === 'directChildren' &&
          (e.target as HTMLElement).parentElement === e.currentTarget) ||
        (e.target as HTMLElement).matches(observedElements)
      ) {
        onElementHover(e.target as HTMLElement);
      }
    },
    [observedElements, onElementHover],
  );

  const handleMouseLeave = React.useCallback(() => {
    onElementHover(null);
  }, [onElementHover]);

  return (
    // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
    <div {...other} onMouseOver={handleMouseOver} onMouseLeave={handleMouseLeave}>
      {props.children}
    </div>
  );
}
