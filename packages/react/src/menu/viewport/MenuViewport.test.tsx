import { describe } from 'vitest';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, describeConformance, viewportConformanceTests } from '#test-utils';

describe('<Menu.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Menu.Root open>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>{node}</Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );
    },
  }));

  viewportConformanceTests({
    render,
    openOn: 'click',
    createComponent: ({ root, triggers, portal, positioner, popup, viewport, renderContent }) => (
      <Menu.Root {...root}>
        {({ payload }) => (
          <React.Fragment>
            {triggers.map(({ key, ...triggerProps }, index) => (
              <Menu.Trigger key={key ?? index} {...triggerProps} />
            ))}
            <Menu.Portal {...portal}>
              <Menu.Positioner {...positioner}>
                <Menu.Popup {...popup}>
                  <Menu.Viewport {...viewport}>{renderContent(payload)}</Menu.Viewport>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </React.Fragment>
        )}
      </Menu.Root>
    ),
  });
});
