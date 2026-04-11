import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { benchmark } from '@mui/internal-benchmark';
import { createRows } from './shared';

const backgroundRows = createRows(1000, 'Background row');
const menuItems = createRows(500, 'Menu item');

function LargeDomMenuSurface() {
  return (
    <div>
      <section>
        {backgroundRows.map((row) => (
          <article key={row.id} data-row={row.id}>
            <h2>{row.label}</h2>
            <p>{row.value}</p>
            <div>
              <span>{row.label}</span>
              <span>{row.value}</span>
              <button type="button">Action {row.id}</button>
            </div>
          </article>
        ))}
      </section>

      <Menu.Root>
        <Menu.Trigger aria-label="Open large DOM menu benchmark">Open menu</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={8} positionMethod="fixed">
            <Menu.Popup>
              {menuItems.map((item) => (
                <Menu.Item key={item.id}>{item.label}</Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}

benchmark(
  'Menu open in large DOM (1,000 background rows)',
  () => <LargeDomMenuSurface />,
  async () => {
    document.querySelector<HTMLElement>('[aria-label="Open large DOM menu benchmark"]')?.click();
  },
);
