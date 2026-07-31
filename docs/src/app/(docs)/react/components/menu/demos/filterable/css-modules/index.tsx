'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import styles from './index.module.css';

const actions = [
  'New file',
  'Open file',
  'Save',
  'Save as',
  'Duplicate',
  'Rename',
  'Move to folder',
  'Download',
  'Delete',
];

const sharingOptions = ['Email', 'Messages', 'AirDrop', 'Copy link'];

export default function FilterableMenu() {
  return (
    <Menu.Root filter>
      <Menu.Trigger className={styles.Trigger}>
        Actions <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8} align="start">
          <Menu.Popup className={styles.Popup}>
            <div className={styles.InputContainer}>
              <Menu.Input
                className={styles.Input}
                aria-label="Filter actions"
                placeholder="e.g. Save"
              />
              <Menu.Clear className={styles.Clear} aria-label="Clear filter">
                <ClearIcon />
              </Menu.Clear>
            </div>
            <Menu.Empty className={styles.Empty}>No actions found.</Menu.Empty>
            <Menu.List className={styles.List}>
              {actions.slice(0, 4).map((action) => (
                <Menu.Item key={action} className={styles.Item}>
                  {action}
                </Menu.Item>
              ))}
              <Menu.SubmenuRoot filter>
                <Menu.SubmenuTrigger className={styles.SubmenuTrigger}>
                  Share
                  <CaretRightIcon />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner
                    className={styles.Positioner}
                    sideOffset={getSubmenuOffset}
                    alignOffset={getSubmenuOffset}
                  >
                    <Menu.Popup className={styles.Popup}>
                      <div className={styles.InputContainer}>
                        <Menu.Input
                          className={styles.Input}
                          aria-label="Filter sharing options"
                          placeholder="e.g. Email"
                        />
                        <Menu.Clear className={styles.Clear} aria-label="Clear filter">
                          <ClearIcon />
                        </Menu.Clear>
                      </div>
                      <Menu.Empty className={styles.Empty}>No sharing options found.</Menu.Empty>
                      <Menu.List className={styles.List}>
                        {sharingOptions.map((option) => (
                          <Menu.Item key={option} className={styles.Item}>
                            {option}
                          </Menu.Item>
                        ))}
                      </Menu.List>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
              {actions.slice(4).map((action) => (
                <Menu.Item key={action} className={styles.Item}>
                  {action}
                </Menu.Item>
              ))}
            </Menu.List>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function getSubmenuOffset({ side }: { side: Menu.Positioner.Props['side'] }) {
  return side === 'top' || side === 'bottom' ? 4 : -4;
}

function CaretDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 6H4l4 4.5z" />
    </svg>
  );
}

function ClearIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m3.5 3.5 9 9m0-9-9 9" />
    </svg>
  );
}

function CaretRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M6 12V4l4.5 4z" />
    </svg>
  );
}
