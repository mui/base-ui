'use client';

import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { Select } from '@base-ui/react/select';
import { Menu } from '@base-ui/react/menu';
import { Dialog } from '@base-ui/react/dialog';
import { Tooltip } from '@base-ui/react/tooltip';
import styles from './popups-in-popups.module.css';

export default function PopupsInPopups() {
  const [modal, setModal] = React.useState(true);
  const [withBackdrop, setWithBackdrop] = React.useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <label>
        <input
          type="checkbox"
          checked={modal}
          onChange={(event) => setModal(event.target.checked)}
        />{' '}
        Modal
      </label>
      <label>
        <input
          type="checkbox"
          checked={withBackdrop}
          onChange={() => setWithBackdrop(!withBackdrop)}
        />{' '}
        With backdrop
      </label>
      <div>
        <Dialog.Root modal={modal}>
          <Dialog.Trigger className={styles.Trigger}>Open Dialog</Dialog.Trigger>

          {withBackdrop && <Dialog.Backdrop className={styles.Backdrop} />}

          <Dialog.Portal>
            <Dialog.Popup className={styles.DialogPopup}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <SelectDemo modal={modal} />
                <MenuDemo modal={modal} />
                <ExampleCombobox />
              </div>
              <div className={styles.DialogControls}>
                <Dialog.Close className={styles.DialogCloseButton}>Cancel</Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}

function SelectDemo({ modal }: Props) {
  return (
    <Select.Root modal={modal} defaultValue="system">
      <Tooltip.Root>
        <Select.Trigger
          aria-label="Select font"
          render={<Tooltip.Trigger className={styles.Trigger} />}
          nativeButton
        >
          <Select.Value />
          <Select.Icon className={styles.SelectDropdownArrow} />
        </Select.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={10}>
            <Tooltip.Popup className={styles.TooltipPopup}>Choose a font</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>

      <Select.Portal>
        <Select.Positioner
          sideOffset={5}
          className={styles.Positioner}
          alignItemWithTrigger={false}
        >
          <Select.Popup className={styles.SelectPopup}>
            <Select.Item className={styles.SelectItem} value="system">
              <Select.ItemIndicator className={styles.SelectItemIndicator} render={<CheckIcon />} />
              <Select.ItemText>System font</Select.ItemText>
            </Select.Item>
            <Select.Item className={styles.SelectItem} value="arial">
              <Select.ItemIndicator className={styles.SelectItemIndicator} render={<CheckIcon />} />
              <Select.ItemText>Arial</Select.ItemText>
            </Select.Item>
            <Select.Item className={styles.SelectItem} value="roboto">
              <Select.ItemIndicator className={styles.SelectItemIndicator} render={<CheckIcon />} />
              <Select.ItemText>Roboto</Select.ItemText>
            </Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

const createHandleMenuClick = (menuItem: string) => {
  return () => {
    console.log(`Clicked on ${menuItem}`);
  };
};

function MenuDemo({ modal }: Props) {
  return (
    <Menu.Root modal={modal}>
      <Menu.Trigger className={styles.Trigger}>Format</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="start" sideOffset={6} className={styles.Positioner}>
          <Menu.Popup className={styles.MenuPopup}>
            <Menu.SubmenuRoot closeParentOnEsc={false}>
              <Menu.SubmenuTrigger className={styles.SubmenuTrigger}>
                Text color
              </Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner
                  align="start"
                  side="right"
                  sideOffset={12}
                  className={styles.Positioner}
                >
                  <Menu.Popup className={styles.MenuPopup}>
                    <Menu.Item
                      className={styles.MenuItem}
                      onClick={createHandleMenuClick('Text color/Black')}
                    >
                      Black
                    </Menu.Item>
                    <Menu.Item
                      className={styles.MenuItem}
                      onClick={createHandleMenuClick('Text color/Dark grey')}
                    >
                      Dark grey
                    </Menu.Item>
                    <Menu.Item
                      className={styles.MenuItem}
                      onClick={createHandleMenuClick('Text color/Accent')}
                    >
                      Accent
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>

            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger className={styles.SubmenuTrigger}>Style</Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner
                  align="start"
                  side="right"
                  sideOffset={12}
                  className={styles.Positioner}
                >
                  <Menu.Popup className={styles.MenuPopup}>
                    <Menu.SubmenuRoot>
                      <Menu.SubmenuTrigger className={styles.SubmenuTrigger}>
                        Heading
                      </Menu.SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner
                          align="start"
                          side="right"
                          sideOffset={12}
                          className={styles.Positioner}
                        >
                          <Menu.Popup className={styles.MenuPopup}>
                            <Menu.Item
                              className={styles.MenuItem}
                              onClick={createHandleMenuClick('Style/Heading/Level 1')}
                            >
                              Level 1
                            </Menu.Item>
                            <Menu.Item
                              className={styles.MenuItem}
                              onClick={createHandleMenuClick('Style/Heading/Level 2')}
                            >
                              Level 2
                            </Menu.Item>
                            <Menu.Item
                              className={styles.MenuItem}
                              onClick={createHandleMenuClick('Style/Heading/Level 3')}
                            >
                              Level 3
                            </Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.SubmenuRoot>
                    <Menu.Item
                      className={styles.MenuItem}
                      onClick={createHandleMenuClick('Style/Paragraph')}
                    >
                      Paragraph
                    </Menu.Item>
                    <Menu.SubmenuRoot disabled>
                      <Menu.SubmenuTrigger className={styles.SubmenuTrigger}>
                        List
                      </Menu.SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner
                          align="start"
                          side="right"
                          sideOffset={12}
                          className={styles.Positioner}
                        >
                          <Menu.Popup className={styles.MenuPopup}>
                            <Menu.Item
                              className={styles.MenuItem}
                              onClick={createHandleMenuClick('Style/List/Ordered')}
                            >
                              Ordered
                            </Menu.Item>
                            <Menu.Item
                              className={styles.MenuItem}
                              onClick={createHandleMenuClick('Style/List/Unordered')}
                            >
                              Unordered
                            </Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.SubmenuRoot>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>

            <Menu.Item
              className={styles.MenuItem}
              onClick={createHandleMenuClick('Clear formatting')}
            >
              Clear formatting
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

interface Props {
  modal: boolean;
}

function ExampleCombobox() {
  const id = React.useId();
  return (
    <Combobox.Root items={fruits}>
      <div className="relative flex flex-col gap-1 text-sm leading-5 font-medium text-gray-900">
        <label htmlFor={id}>Choose a fruit</label>
        <Combobox.Input
          placeholder="e.g. Apple"
          id={id}
          className="h-10 w-64 rounded-md font-normal border border-gray-200 pl-3.5 text-base text-gray-900 bg-[canvas] focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
        />
        <div className="absolute right-2 bottom-0 flex h-10 items-center justify-center text-gray-600">
          <Combobox.Clear
            className="flex h-10 w-6 items-center justify-center rounded bg-transparent p-0"
            aria-label="Clear selection"
          >
            <ClearIcon className="size-4" />
          </Combobox.Clear>
          <Combobox.Trigger
            className="flex h-10 w-6 items-center justify-center rounded bg-transparent p-0"
            aria-label="Open popup"
          >
            <ChevronDownIcon className="size-4" />
          </Combobox.Trigger>
        </div>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className="outline-none" sideOffset={4}>
          <Combobox.Popup className="w-[var(--anchor-width)] max-h-[min(var(--available-height),23rem)] max-w-[var(--available-width)] origin-[var(--transform-origin)] overflow-y-auto scroll-pt-2 scroll-pb-2 overscroll-contain rounded-md bg-[canvas] py-2 text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
            <Combobox.Empty className="px-4 py-2 text-[0.925rem] leading-4 text-gray-600 empty:m-0 empty:p-0">
              No fruits found.
            </Combobox.Empty>
            <Combobox.List>
              {(item: string) => (
                <Combobox.Item
                  key={item}
                  value={item}
                  className="grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-8 pl-4 text-base leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900"
                >
                  <Combobox.ItemIndicator className="col-start-1">
                    <CheckIcon className="size-3" />
                  </Combobox.ItemIndicator>
                  <div className="col-start-2">{item}</div>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function ClearIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

const fruits = [
  'Apple',
  'Banana',
  'Orange',
  'Pineapple',
  'Grape',
  'Mango',
  'Strawberry',
  'Blueberry',
  'Raspberry',
  'Blackberry',
  'Cherry',
  'Peach',
  'Pear',
  'Plum',
  'Kiwi',
  'Watermelon',
  'Cantaloupe',
  'Honeydew',
  'Papaya',
  'Guava',
  'Lychee',
  'Pomegranate',
  'Apricot',
  'Grapefruit',
  'Passionfruit',
];
