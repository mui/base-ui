'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import styles from './index.module.css';

export default function ExampleMenuFilter() {
  return (
    <Menu.FilterRoot>
      <Menu.Trigger className={styles.Trigger}>
        Actions <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8} align="start">
          <Menu.Popup className={styles.Popup}>
            <div className={styles.InputContainer}>
              <Menu.FilterInput
                className={styles.Input}
                aria-label="Filter actions"
                placeholder="e.g. Save"
              />
              <Menu.FilterClear className={styles.Clear} aria-label="Clear filter">
                <ClearIcon />
              </Menu.FilterClear>
            </div>
            <Menu.FilterEmpty className={styles.Empty}>No actions found.</Menu.FilterEmpty>
            <Menu.FilterList className={styles.List}>
              <Menu.Group className={styles.Section}>
                <Menu.GroupLabel className={styles.GroupLabel}>File</Menu.GroupLabel>
                <Menu.Item className={styles.Item}>New file</Menu.Item>
                <Menu.Item className={styles.Item}>Open file</Menu.Item>
                <Menu.Item className={styles.Item}>Save</Menu.Item>
                <Menu.Item className={styles.Item}>Save as</Menu.Item>
                <Menu.Item className={styles.Item}>Duplicate</Menu.Item>
                <Menu.Item className={styles.Item}>Rename</Menu.Item>
              </Menu.Group>
              <Menu.Group className={styles.Section}>
                <Menu.GroupLabel className={styles.GroupLabel}>Organize</Menu.GroupLabel>
                <FilterableSubmenu
                  label="Move to folder"
                  inputLabel="Filter folders"
                  placeholder="e.g. Projects"
                  emptyText="No folders found."
                  options={folderOptions}
                />
                <FilterableSubmenu
                  label="Share"
                  inputLabel="Filter sharing options"
                  placeholder="e.g. Email"
                  emptyText="No sharing options found."
                  options={sharingOptions}
                />
                <FilterableSubmenu
                  label="Export"
                  inputLabel="Filter export formats"
                  placeholder="e.g. PDF"
                  emptyText="No export formats found."
                  options={exportOptions}
                />
                <Menu.Item className={styles.Item}>Download a copy</Menu.Item>
                <Menu.Item className={styles.Item} keywords={['remove', 'trash']}>
                  Delete
                </Menu.Item>
              </Menu.Group>

              <Menu.RadioGroup className={styles.Section} defaultValue="date">
                <Menu.Separator className={styles.Separator} />
                <Menu.GroupLabel className={styles.GroupLabel}>Sort by</Menu.GroupLabel>
                {[
                  ['date', 'Date modified'],
                  ['name', 'Name'],
                  ['size', 'Size'],
                ].map(([value, label]) => (
                  <Menu.RadioItem key={value} className={styles.ChoiceItem} value={value}>
                    <Menu.RadioItemIndicator className={styles.ChoiceIndicator}>
                      <CheckIcon />
                    </Menu.RadioItemIndicator>
                    <span className={styles.ChoiceText}>{label}</span>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>

              <Menu.Group className={styles.Section}>
                <Menu.Separator className={styles.Separator} />
                <Menu.GroupLabel className={styles.GroupLabel}>View</Menu.GroupLabel>
                <Menu.CheckboxItem className={styles.ChoiceItem} defaultChecked>
                  <Menu.CheckboxItemIndicator className={styles.ChoiceIndicator}>
                    <CheckIcon />
                  </Menu.CheckboxItemIndicator>
                  <span className={styles.ChoiceText}>Show details</span>
                </Menu.CheckboxItem>
                <Menu.CheckboxItem className={styles.ChoiceItem}>
                  <Menu.CheckboxItemIndicator className={styles.ChoiceIndicator}>
                    <CheckIcon />
                  </Menu.CheckboxItemIndicator>
                  <span className={styles.ChoiceText}>Show sidebar</span>
                </Menu.CheckboxItem>
                <Menu.CheckboxItem className={styles.ChoiceItem}>
                  <Menu.CheckboxItemIndicator className={styles.ChoiceIndicator}>
                    <CheckIcon />
                  </Menu.CheckboxItemIndicator>
                  <span className={styles.ChoiceText}>Keep available offline</span>
                </Menu.CheckboxItem>
              </Menu.Group>
            </Menu.FilterList>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.FilterRoot>
  );
}

interface FilterableSubmenuProps {
  label: string;
  inputLabel: string;
  placeholder: string;
  emptyText: string;
  options: readonly string[];
}

function FilterableSubmenu(props: FilterableSubmenuProps) {
  return (
    <Menu.FilterSubmenuRoot>
      <Menu.SubmenuTrigger className={styles.SubmenuTrigger}>
        {props.label}
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
              <Menu.FilterInput
                className={styles.Input}
                aria-label={props.inputLabel}
                placeholder={props.placeholder}
              />
              <Menu.FilterClear className={styles.Clear} aria-label="Clear filter">
                <ClearIcon />
              </Menu.FilterClear>
            </div>
            <Menu.FilterEmpty className={styles.Empty}>{props.emptyText}</Menu.FilterEmpty>
            <Menu.FilterList className={`${styles.List} ${styles.SubmenuList}`}>
              {props.options.map((option) => (
                <Menu.Item key={option} className={styles.Item}>
                  {option}
                </Menu.Item>
              ))}
            </Menu.FilterList>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.FilterSubmenuRoot>
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

function CheckIcon(props: React.ComponentProps<'svg'>) {
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
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

const sharingOptions = [
  'Email',
  'Messages',
  'AirDrop',
  'Copy link',
  'Invite collaborators',
  'Publish to web',
  'Send a copy',
];

const folderOptions = [
  'Desktop',
  'Documents',
  'Downloads',
  'Projects',
  'Archive',
  'Shared',
  'Trash',
];

const exportOptions = [
  'PDF document',
  'Word document',
  'Plain text',
  'Rich text',
  'Markdown',
  'HTML page',
  'Image',
];
