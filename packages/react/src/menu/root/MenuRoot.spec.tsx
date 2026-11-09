import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { expectType } from '#test-utils';

<Menu.Root
  onItemHighlighted={(item, details) => {
    const element: HTMLElement | undefined = item;
    const reason: 'keyboard' | 'pointer' | 'none' = details.reason;
    const label: string | undefined = details.label;

    const event: Event = details.event;
    // @ts-expect-error positional indexes are not part of the highlight notification
    const index = details.index;
  }}
/>;

<Menu.Root
  onItemHighlighted={(_item, details) => {
    if (details.reason === 'pointer') {
      expectType<MouseEvent | PointerEvent, typeof details.event>(details.event);
      // @ts-expect-error Hover can report a MouseEvent without pointer-specific methods.
      details.event.getCoalescedEvents();
      if (details.event instanceof PointerEvent) {
        expectType<PointerEvent, typeof details.event>(details.event);
        details.event.getCoalescedEvents();
      }
    } else if (details.reason === 'keyboard') {
      expectType<KeyboardEvent, typeof details.event>(details.event);
    } else {
      expectType<Event, typeof details.event>(details.event);
    }
  }}
/>;
