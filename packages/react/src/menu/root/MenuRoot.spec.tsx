import * as React from 'react';
import { Menu } from '@base-ui/react/menu';

<Menu.Root
  onItemHighlighted={(item, details) => {
    const element: HTMLElement | undefined = item;
    const reason: 'keyboard' | 'pointer' | 'imperative-action' | 'none' = details.reason;
    const label: string | undefined = details.label;

    const event: Event = details.event;
    // @ts-expect-error positional indexes are not part of the highlight notification
    const index = details.index;
  }}
/>;
