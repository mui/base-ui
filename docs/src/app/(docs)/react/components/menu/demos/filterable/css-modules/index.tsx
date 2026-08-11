'use client';
import * as React from 'react';
import { FilterMenu } from '@base-ui/react/filter-menu';
import styles from './index.module.css';

const sharingOptions = ['Email', 'Messages', 'AirDrop', 'Copy link'];

const actions = [
  'New file',
  'Open file',
  'Save',
  'Save as',
  { label: 'Share', options: sharingOptions },
  'Duplicate',
  'Rename',
  'Move to folder',
  'Download',
  'Delete',
];

export default function FilterMenuDemo() {
  return (
    <FilterMenu.Root items={actions}>
      <FilterMenu.Trigger className={styles.Trigger}>
        Actions <CaretDownIcon />
      </FilterMenu.Trigger>
      <FilterMenu.Portal>
        <FilterMenu.Positioner className={styles.Positioner} sideOffset={8} align="start">
          <FilterMenu.Popup className={styles.Popup}>
            <div className={styles.InputContainer}>
              <FilterMenu.Input
                className={styles.Input}
                aria-label="Filter actions"
                placeholder="e.g. Save"
              />
              <FilterMenu.Clear className={styles.Clear} aria-label="Clear filter">
                <ClearIcon />
              </FilterMenu.Clear>
            </div>
            <FilterMenu.Empty className={styles.Empty}>No actions found.</FilterMenu.Empty>
            <FilterMenu.List className={styles.List}>
              {(action) =>
                typeof action === 'string' ? (
                  <FilterMenu.Item key={action} className={styles.Item}>
                    {action}
                  </FilterMenu.Item>
                ) : (
                  <FilterMenu.SubmenuRoot key={action.label} items={action.options}>
                    <FilterMenu.SubmenuTrigger className={styles.SubmenuTrigger}>
                      {action.label}
                      <CaretRightIcon />
                    </FilterMenu.SubmenuTrigger>
                    <FilterMenu.Portal>
                      <FilterMenu.Positioner
                        className={styles.Positioner}
                        sideOffset={getSubmenuOffset}
                        alignOffset={getSubmenuOffset}
                      >
                        <FilterMenu.Popup className={styles.Popup}>
                          <div className={styles.InputContainer}>
                            <FilterMenu.Input
                              className={styles.Input}
                              aria-label="Filter sharing options"
                              placeholder="e.g. Email"
                            />
                            <FilterMenu.Clear className={styles.Clear} aria-label="Clear filter">
                              <ClearIcon />
                            </FilterMenu.Clear>
                          </div>
                          <FilterMenu.Empty className={styles.Empty}>
                            No sharing options found.
                          </FilterMenu.Empty>
                          <FilterMenu.List className={styles.List}>
                            {(option) => (
                              <FilterMenu.Item key={option} className={styles.Item}>
                                {option}
                              </FilterMenu.Item>
                            )}
                          </FilterMenu.List>
                        </FilterMenu.Popup>
                      </FilterMenu.Positioner>
                    </FilterMenu.Portal>
                  </FilterMenu.SubmenuRoot>
                )
              }
            </FilterMenu.List>
          </FilterMenu.Popup>
        </FilterMenu.Positioner>
      </FilterMenu.Portal>
    </FilterMenu.Root>
  );
}

function getSubmenuOffset({ side }: { side: FilterMenu.Positioner.Props['side'] }) {
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
