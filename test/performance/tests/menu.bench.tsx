import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { benchmark, ElementTiming } from '@mui/internal-benchmark';
import { createRows, MountList } from './shared';
import styles from './styles/menu.module.css';

const menuRows = createRows(300, 'Menu');
const menuItems = createRows(5, 'Menu item');
const largeMenuItems = createRows(500, 'Menu item');

function MenuMountList() {
  return (
    <MountList rows={menuRows}>
      {(row) => (
        <Menu.Root key={row.id}>
          <Menu.Trigger aria-label={`Open ${row.label}`} className={styles.Button}>
            {row.label}
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner sideOffset={8} className={styles.Positioner}>
              <Menu.Popup className={styles.Popup}>
                {menuItems.map((item) => (
                  <Menu.Item key={item.id} className={styles.Item}>
                    {item.label}
                  </Menu.Item>
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      )}
    </MountList>
  );
}

function LargeMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label="Open menu benchmark" className={styles.Button}>
        Open menu
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} positionMethod="fixed" className={styles.Positioner}>
          <Menu.Popup className={styles.Popup}>
            <div data-benchmark="menu-open-content">
              <ElementTiming name="menu-open" />
            </div>
            {largeMenuItems.map((item) => (
              <Menu.Item key={item.id} className={styles.Item}>
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

benchmark('Menu mount (300 instances)', () => <MenuMountList />);

benchmark(
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
