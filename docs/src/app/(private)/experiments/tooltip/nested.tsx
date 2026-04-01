'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import styles from './nested.module.css';

export default function NestedTooltipsExperiment() {
  return (
    <div className={styles.Container}>
      <h1>Nested Tooltips</h1>
      <p>
        Hovering over the row should show the row tooltip. Hovering over the icon button inside the
        row should show only the button tooltip, not the row tooltip.
      </p>

      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger render={<div />} className={styles.Row}>
            <span>Row 1 - Hover me for row tooltip</span>
            <Tooltip.Root>
              <Tooltip.Trigger className={styles.IconButton}>A</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner sideOffset={5}>
                  <Tooltip.Popup className={styles.Popup}>Action A tooltip</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
            <Tooltip.Root>
              <Tooltip.Trigger className={styles.IconButton}>B</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner sideOffset={5}>
                  <Tooltip.Popup className={styles.Popup}>Action B tooltip</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={5}>
              <Tooltip.Popup className={styles.Popup}>Row 1 tooltip</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger render={<div />} className={styles.Row}>
            <span>Row 2 - Hover me for row tooltip</span>
            <Tooltip.Root>
              <Tooltip.Trigger className={styles.IconButton}>C</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner sideOffset={5}>
                  <Tooltip.Popup className={styles.Popup}>Action C tooltip</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={5}>
              <Tooltip.Popup className={styles.Popup}>Row 2 tooltip</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  );
}
