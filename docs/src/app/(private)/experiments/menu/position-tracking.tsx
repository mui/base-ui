'use client';

import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { getTarget } from '@base-ui/utils/shadowDom';
import { useExperimentSettings } from '../_components/SettingsPanel';
import type { SettingsMetadata } from '../_components/SettingsPanel';
import menuStyles from './menu.module.css';
import styles from './position-tracking.module.css';

interface Settings {
  withViewport: boolean;
  keepMounted: boolean;
}

export default function PositionTracking() {
  const [handle] = React.useState(() => Menu.createHandle());
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const { settings } = useExperimentSettings<Settings>();

  const items = (
    <React.Fragment>
      <Menu.Item className={menuStyles.Item}>Edit</Menu.Item>
      <Menu.Item className={menuStyles.Item}>Duplicate</Menu.Item>
      <Menu.Item className={menuStyles.Item}>Delete</Menu.Item>
    </React.Fragment>
  );

  return (
    <div className={styles.Page}>
      <h1>Menu position tracking</h1>
      <ol className={styles.Instructions}>
        <li>Open First, then scroll inside the box before switching triggers.</li>
        <li>Drag the box’s bottom-right corner horizontally, or resize the browser window.</li>
        <li>The menu should stay attached to First without trailing behind it.</li>
        <li>Click Second: the menu should glide to it. Repeat scrolling and resizing.</li>
        <li>
          Click Second again to close, then reopen First: the popup should still fade out and in.
        </li>
      </ol>
      <p>
        Before the fix, scrolling and resizing animate the menu’s position until the first trigger
        switch. The position transition lasts 600 ms here to make any lag easy to see. Enable “With
        Viewport” in Settings to also check positioning with top and left.
      </p>

      <div ref={scrollerRef} className={styles.Scroller}>
        <div className={styles.Content}>
          <Menu.Trigger handle={handle} className={menuStyles.Button}>
            First
          </Menu.Trigger>
          <Menu.Trigger handle={handle} className={menuStyles.Button}>
            Second
          </Menu.Trigger>
        </div>
      </div>

      <Menu.Root
        handle={handle}
        modal={false}
        onOpenChange={(_open, details) => {
          // Let the resize handle and scrollbar be used without dismissing the menu.
          if (
            details.reason === 'outside-press' &&
            getTarget(details.event) === scrollerRef.current
          ) {
            details.cancel();
          }
        }}
      >
        <Menu.Portal keepMounted={settings.keepMounted}>
          <Menu.Positioner className={styles.Positioner} side="right" align="start" sideOffset={8}>
            <Menu.Popup className={`${menuStyles.Popup} ${styles.Popup}`}>
              {settings.withViewport ? <Menu.Viewport>{items}</Menu.Viewport> : items}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}

export const settingsMetadata: SettingsMetadata<Settings> = {
  withViewport: { type: 'boolean', label: 'With Viewport', default: false },
  keepMounted: { type: 'boolean', label: 'Keep mounted', default: false },
};
