'use client';
import * as React from 'react';
import { FilterableMenu } from '@base-ui-components/react/filterable-menu';
import styles from './index.module.css';

export default function ExampleFilterableMenu() {
  return (
    <FilterableMenu.Root items={ITEMS}>
      <FilterableMenu.Trigger className={styles.Button}>
        Options
        <FilterableMenu.Icon>
          <ChevronDownIcon className={styles.ButtonIcon} />
        </FilterableMenu.Icon>
      </FilterableMenu.Trigger>
      <FilterableMenu.Portal>
        <FilterableMenu.Positioner className={styles.Positioner} sideOffset={8}>
          <FilterableMenu.Popup className={styles.Popup} aria-label="Options Menu">
            <FilterableMenu.Arrow className={styles.Arrow}>
              <ArrowSvg />
            </FilterableMenu.Arrow>

            <div className={styles.InputContainer}>
              <FilterableMenu.Input className={styles.Input} placeholder="Filter options…" />
            </div>

            <FilterableMenu.Empty className={styles.Empty}>No results found.</FilterableMenu.Empty>

            <FilterableMenu.List className={styles.List}>
              <FilterableMenu.Collection>
                {(item: string) => (
                  <FilterableMenu.Item key={item} value={item} className={styles.Item}>
                    {item}
                  </FilterableMenu.Item>
                )}
              </FilterableMenu.Collection>
            </FilterableMenu.List>
          </FilterableMenu.Popup>
        </FilterableMenu.Positioner>
      </FilterableMenu.Portal>
    </FilterableMenu.Root>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className={styles.ArrowFill}
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className={styles.ArrowOuterStroke}
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className={styles.ArrowInnerStroke}
      />
    </svg>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" strokeWidth="1.5" />
    </svg>
  );
}

const ITEMS: string[] = [
  'New File',
  'New Window',
  'Open File…',
  'Open Recent',
  'Save',
  'Save As…',
  'Revert',
  'Close Tab',
  'Close Window',
  'Export…',
  'Import…',
  'Share',
  'Duplicate',
  'Rename',
  'Move to Trash',
  'Restore',
  'Find…',
  'Find Next',
  'Find Previous',
  'Replace…',
  'Select All',
  'Cut',
  'Copy',
  'Paste',
  'Paste and Match Style',
  'Delete',
  'Undo',
  'Redo',
  'Zoom In',
  'Zoom Out',
  'Toggle Full Screen',
  'Minimize',
  'Maximize',
  'Preferences…',
  'Settings',
  'View Source',
  'Reload',
  'Toggle Sidebar',
  'Show Status Bar',
  'Check for Updates…',
];
