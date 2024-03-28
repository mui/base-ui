import * as React from 'react';
import { useBubble } from './useBubble';
import { TabsContext } from '../TabsContext';
import { TabsBubbleProps } from './Bubble.types';

export const TabsBubble = React.forwardRef<HTMLSpanElement, TabsBubbleProps>(
  function TabsBubble(props, forwardedRef) {
    const tabsContext = React.useContext(TabsContext);
    if (tabsContext == null) {
      throw new Error('Bubble must be used within a Tabs component');
    }

    const { orientation } = tabsContext;

    const selectedTabProperties = useBubble();
    if (!selectedTabProperties) {
      return null;
    }

    const { left, right, top, bottom, movementDirection } = selectedTabProperties;

    return (
      <span
        ref={forwardedRef}
        style={
          {
            '--selected-tab-left': `${left}px`,
            '--selected-tab-right': `${right}px`,
            '--selected-tab-top': `${top}px`,
            '--selected-tab-bottom': `${bottom}px`,
            '--selection-forwards': movementDirection === 1 ? '1' : '0',
            '--selection-backwards': movementDirection === -1 ? '1' : '0',
          } as any
        }
        data-orientation={orientation}
        {...props}
      />
    );
  },
);
