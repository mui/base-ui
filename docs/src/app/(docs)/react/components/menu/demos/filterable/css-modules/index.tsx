'use client';
import * as React from 'react';
import { FilterMenu } from '@base-ui/react/filter-menu';
import styles from './index.module.css';

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

export default function FilterMenuDemo() {
  const [sortBy, setSortBy] = React.useState('date');
  const [showDetails, setShowDetails] = React.useState(true);
  const [showSidebar, setShowSidebar] = React.useState(false);
  const [keepOffline, setKeepOffline] = React.useState(false);

  return (
    <FilterMenu.Root>
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
              <FilterMenu.Group>
                <FilterMenu.GroupLabel className={styles.GroupLabel}>File</FilterMenu.GroupLabel>
                <FilterMenu.Item className={styles.Item}>New file</FilterMenu.Item>
                <FilterMenu.Item className={styles.Item}>Open file</FilterMenu.Item>
                <FilterMenu.Item className={styles.Item}>Save</FilterMenu.Item>
                <FilterMenu.Item className={styles.Item}>Save as</FilterMenu.Item>
                <FilterMenu.Item className={styles.Item}>Duplicate</FilterMenu.Item>
                <FilterMenu.Item className={styles.Item}>Rename</FilterMenu.Item>
              </FilterMenu.Group>
              <FilterMenu.Group>
                <FilterMenu.GroupLabel className={styles.GroupLabel}>
                  Organize
                </FilterMenu.GroupLabel>
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
                <FilterMenu.Item className={styles.Item}>Download a copy</FilterMenu.Item>
                <FilterMenu.Item className={styles.Item} keywords={['remove', 'trash']}>
                  Delete
                </FilterMenu.Item>
              </FilterMenu.Group>

              <FilterMenu.Separator className={styles.Separator} />

              <FilterMenu.RadioGroup value={sortBy} onValueChange={setSortBy}>
                <FilterMenu.GroupLabel className={styles.GroupLabel}>Sort by</FilterMenu.GroupLabel>
                {[
                  ['date', 'Date modified'],
                  ['name', 'Name'],
                  ['size', 'Size'],
                ].map(([value, label]) => (
                  <FilterMenu.RadioItem key={value} className={styles.ChoiceItem} value={value}>
                    <FilterMenu.RadioItemIndicator className={styles.ChoiceIndicator}>
                      <CheckIcon />
                    </FilterMenu.RadioItemIndicator>
                    <span>{label}</span>
                  </FilterMenu.RadioItem>
                ))}
              </FilterMenu.RadioGroup>

              <FilterMenu.Separator className={styles.Separator} />

              <FilterMenu.Group>
                <FilterMenu.GroupLabel className={styles.GroupLabel}>View</FilterMenu.GroupLabel>
                <FilterMenu.CheckboxItem
                  className={styles.ChoiceItem}
                  checked={showDetails}
                  onCheckedChange={setShowDetails}
                >
                  <FilterMenu.CheckboxItemIndicator className={styles.ChoiceIndicator}>
                    <CheckIcon />
                  </FilterMenu.CheckboxItemIndicator>
                  <span>Show details</span>
                </FilterMenu.CheckboxItem>
                <FilterMenu.CheckboxItem
                  className={styles.ChoiceItem}
                  checked={showSidebar}
                  onCheckedChange={setShowSidebar}
                >
                  <FilterMenu.CheckboxItemIndicator className={styles.ChoiceIndicator}>
                    <CheckIcon />
                  </FilterMenu.CheckboxItemIndicator>
                  <span>Show sidebar</span>
                </FilterMenu.CheckboxItem>
                <FilterMenu.CheckboxItem
                  className={styles.ChoiceItem}
                  checked={keepOffline}
                  onCheckedChange={setKeepOffline}
                >
                  <FilterMenu.CheckboxItemIndicator className={styles.ChoiceIndicator}>
                    <CheckIcon />
                  </FilterMenu.CheckboxItemIndicator>
                  <span>Keep available offline</span>
                </FilterMenu.CheckboxItem>
              </FilterMenu.Group>
            </FilterMenu.List>
          </FilterMenu.Popup>
        </FilterMenu.Positioner>
      </FilterMenu.Portal>
    </FilterMenu.Root>
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
    <FilterMenu.SubmenuRoot>
      <FilterMenu.SubmenuTrigger className={styles.SubmenuTrigger}>
        {props.label}
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
                aria-label={props.inputLabel}
                placeholder={props.placeholder}
              />
              <FilterMenu.Clear className={styles.Clear} aria-label="Clear filter">
                <ClearIcon />
              </FilterMenu.Clear>
            </div>
            <FilterMenu.Empty className={styles.Empty}>{props.emptyText}</FilterMenu.Empty>
            <FilterMenu.List className={styles.List}>
              {props.options.map((option) => (
                <FilterMenu.Item key={option} className={styles.Item}>
                  {option}
                </FilterMenu.Item>
              ))}
            </FilterMenu.List>
          </FilterMenu.Popup>
        </FilterMenu.Positioner>
      </FilterMenu.Portal>
    </FilterMenu.SubmenuRoot>
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
