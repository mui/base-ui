import { describe } from 'vitest';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { createRenderer, describeConformance, viewportConformanceTests } from '#test-utils';

describe('<Popover.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>{node}</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );
    },
  }));

  viewportConformanceTests({
    render,
    openOn: 'click',
    createComponent: ({ root, triggers, portal, positioner, popup, viewport, renderContent }) => (
      <Popover.Root {...root}>
        {({ payload }) => (
          <React.Fragment>
            {triggers.map(({ key, ...triggerProps }, index) => (
              <Popover.Trigger key={key ?? index} {...triggerProps} />
            ))}
            <Popover.Portal {...portal}>
              <Popover.Positioner {...positioner}>
                <Popover.Popup {...popup}>
                  <Popover.Viewport {...viewport}>{renderContent(payload)}</Popover.Viewport>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </React.Fragment>
        )}
      </Popover.Root>
    ),
  });
});
