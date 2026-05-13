'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import styles from './index.module.css';

export default function ExampleMenu() {
  const [showMinimap, setShowMinimap] = React.useState(true);
  const [showSearch, setShowSearch] = React.useState(true);
  const [showSidebar, setShowSidebar] = React.useState(false);

  return (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        Workspace <ChevronDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.CheckboxItem
              checked={showMinimap}
              onCheckedChange={setShowMinimap}
              className={styles.CheckboxItem}
            >
              <Menu.CheckboxItemIndicator className={styles.CheckboxItemIndicator}>
                <CheckboxCheckIcon />
              </Menu.CheckboxItemIndicator>
              <span className={styles.CheckboxItemText}>Minimap</span>
            </Menu.CheckboxItem>
            <Menu.CheckboxItem
              checked={showSearch}
              onCheckedChange={setShowSearch}
              className={styles.CheckboxItem}
            >
              <Menu.CheckboxItemIndicator className={styles.CheckboxItemIndicator}>
                <CheckboxCheckIcon />
              </Menu.CheckboxItemIndicator>
              <span className={styles.CheckboxItemText}>Search</span>
            </Menu.CheckboxItem>
            <Menu.CheckboxItem
              checked={showSidebar}
              onCheckedChange={setShowSidebar}
              className={styles.CheckboxItem}
            >
              <Menu.CheckboxItemIndicator className={styles.CheckboxItemIndicator}>
                <CheckboxCheckIcon />
              </Menu.CheckboxItemIndicator>
              <span className={styles.CheckboxItemText}>Sidebar</span>
            </Menu.CheckboxItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 10 10"
      fill="none"
      strokeWidth="1"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentColor" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function CheckboxCheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M20 6 9 17l-5-5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
