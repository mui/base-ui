import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { ElementTiming, reactBenchmark } from '@mui/internal-benchmark/page';
import { createRows } from './shared';

const largeMenuItems = createRows(500, 'Menu item');

function LargeMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label="Open menu benchmark">Open menu</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} positionMethod="fixed">
          <Menu.Popup>
            <div data-benchmark="menu-open-content">
              <ElementTiming name="menu-open" />
            </div>
            {largeMenuItems.map((item) => (
              <Menu.Item key={item.id}>{item.label}</Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

reactBenchmark(
  'Menu open (500 items)',
  () => <LargeMenu />,
  async ({ waitForElementTiming }) => {
    const trigger = document.querySelector<HTMLElement>('[aria-label="Open menu benchmark"]');

    if (trigger == null) {
      throw new Error('Missing menu benchmark trigger');
    }

    trigger.click();
    await waitForElementTiming('menu-open');

    if (document.querySelector('[data-benchmark="menu-open-content"]') == null) {
      throw new Error('Menu benchmark popup did not open');
    }
  },
);
