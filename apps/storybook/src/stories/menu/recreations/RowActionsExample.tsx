import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import styles from '../menu.module.css';
import { EllipsisIcon } from '../icons';

/**
 * Recreation of a data-table row-actions menu: kebab trigger per row,
 * `modal={false}` so the page never locks scroll (the wrapper's own stated
 * reason), `align="end"` positioning, and a destructive item. Recomposed from
 * oxidecomputer/console `DropdownMenu.tsx` (MPL-2.0, code-ok,
 * research/d-real-world-usage/menu/ranked.json #4).
 */

const fleetInstances = [
  { id: 'db-primary', dram: '16 GiB', status: 'running' },
  { id: 'db-replica', dram: '16 GiB', status: 'running' },
  { id: 'web-frontend', dram: '8 GiB', status: 'stopped' },
];

export function RowActionsExample() {
  const [lastAction, setLastAction] = React.useState('none');
  return (
    <div className={styles.Stack}>
      <table className={styles.Table}>
        <thead>
          <tr>
            <th>Instance</th>
            <th>DRAM</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {fleetInstances.map((instance) => (
            <tr key={instance.id}>
              <td>{instance.id}</td>
              <td>{instance.dram}</td>
              <td>{instance.status}</td>
              <td>
                {/* modal={false}: row-action menus must not lock page scroll. */}
                <Menu.Root modal={false}>
                  <Menu.Trigger
                    className={styles.IconButton}
                    aria-label={`Row actions for ${instance.id}`}
                  >
                    <EllipsisIcon />
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner
                      className={styles.Positioner}
                      side="bottom"
                      align="end"
                      sideOffset={4}
                    >
                      <Menu.Popup className={styles.Popup}>
                        <Menu.Item
                          className={styles.Item}
                          onClick={() => setLastAction(`Start ${instance.id}`)}
                        >
                          Start
                        </Menu.Item>
                        <Menu.Item
                          className={styles.Item}
                          onClick={() => setLastAction(`Stop ${instance.id}`)}
                        >
                          Stop
                        </Menu.Item>
                        <Menu.Separator className={styles.Separator} />
                        <Menu.Item
                          className={`${styles.Item} ${styles.DangerItem}`}
                          onClick={() => setLastAction(`Delete ${instance.id}`)}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <output className={styles.Output}>last action: {lastAction}</output>
    </div>
  );
}
