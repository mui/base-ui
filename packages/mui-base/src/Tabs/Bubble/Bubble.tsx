import * as React from 'react';
import { useBubble } from './useBubble';

interface TabsBubbleProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const TabsBubble = React.forwardRef<HTMLSpanElement, TabsBubbleProps>(
  function TabsBubble(props, forwardedRef) {
    const selectedTabProperties = useBubble();
    if (!selectedTabProperties) {
      return null;
    }

    const { left, right, top, bottom, direction } = selectedTabProperties;

    return (
      <span
        ref={forwardedRef}
        style={
          {
            '--selected-tab-left': `${left}px`,
            '--selected-tab-right': `${right}px`,
            '--selected-tab-top': `${top}px`,
            '--selected-tab-bottom': `${bottom}px`,
            '--selection-forwards': direction === 1 ? '1' : '0',
            '--selection-backwards': direction === -1 ? '1' : '0',
          } as any
        }
        {...props}
      />
    );
  },
);
