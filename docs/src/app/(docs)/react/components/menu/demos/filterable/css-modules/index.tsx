'use client';
import * as React from 'react';
import { FilterableMenu } from '@base-ui/react/filterable-menu';
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

export default function FilterableMenuDemo() {
  return (
    <FilterableMenu.Root filter>
      <FilterableMenu.Trigger className={styles.Trigger}>
        Actions <CaretDownIcon />
      </FilterableMenu.Trigger>
      <FilterableMenu.Portal>
        <FilterableMenu.Positioner className={styles.Positioner} sideOffset={8} align="start">
          <FilterableMenu.Popup className={styles.Popup}>
            <div className={styles.InputContainer}>
              <FilterableMenu.Input
                className={styles.Input}
                aria-label="Filter actions"
                placeholder="e.g. Save"
              />
              <FilterableMenu.Clear className={styles.Clear} aria-label="Clear filter">
                <ClearIcon />
              </FilterableMenu.Clear>
            </div>
            <FilterableMenu.Empty className={styles.Empty}>No actions found.</FilterableMenu.Empty>
            <FilterableMenu.List className={styles.List}>
              {actions.slice(0, 4).map((action) => (
                <FilterableMenu.Item key={action} className={styles.Item}>
                  {action}
                </FilterableMenu.Item>
              ))}
              <FilterableMenu.SubmenuRoot filter>
                <FilterableMenu.SubmenuTrigger className={styles.SubmenuTrigger}>
                  Share
                  <CaretRightIcon />
                </FilterableMenu.SubmenuTrigger>
                <FilterableMenu.Portal>
                  <FilterableMenu.Positioner
                    className={styles.Positioner}
                    sideOffset={getSubmenuOffset}
                    alignOffset={getSubmenuOffset}
                  >
                    <FilterableMenu.Popup className={styles.Popup}>
                      <div className={styles.InputContainer}>
                        <FilterableMenu.Input
                          className={styles.Input}
                          aria-label="Filter sharing options"
                          placeholder="e.g. Email"
                        />
                        <FilterableMenu.Clear className={styles.Clear} aria-label="Clear filter">
                          <ClearIcon />
                        </FilterableMenu.Clear>
                      </div>
                      <FilterableMenu.Empty className={styles.Empty}>
                        No sharing options found.
                      </FilterableMenu.Empty>
                      <FilterableMenu.List className={styles.List}>
                        {sharingOptions.map((option) => (
                          <FilterableMenu.Item key={option} className={styles.Item}>
                            {option}
                          </FilterableMenu.Item>
                        ))}
                      </FilterableMenu.List>
                    </FilterableMenu.Popup>
                  </FilterableMenu.Positioner>
                </FilterableMenu.Portal>
              </FilterableMenu.SubmenuRoot>
              {actions.slice(4).map((action) => (
                <FilterableMenu.Item key={action} className={styles.Item}>
                  {action}
                </FilterableMenu.Item>
              ))}
            </FilterableMenu.List>
          </FilterableMenu.Popup>
        </FilterableMenu.Positioner>
      </FilterableMenu.Portal>
    </FilterableMenu.Root>
  );
}

function getSubmenuOffset({ side }: { side: FilterableMenu.Positioner.Props['side'] }) {
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
