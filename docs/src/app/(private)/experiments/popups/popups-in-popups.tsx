'use client';

import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import { Select } from '@base-ui-components/react/select';
import { Menu } from '@base-ui-components/react/menu';
import { Dialog } from '@base-ui-components/react/dialog';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { styled } from '@mui/system';

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
          <Dialog.Trigger render={<Trigger />}>Open Dialog</Dialog.Trigger>

          {withBackdrop && <Dialog.Backdrop render={<Backdrop />} />}

          <Dialog.Portal>
            <DialogPopup>
              <div style={{ display: 'flex', gap: '10px' }}>
                <SelectDemo modal={modal} />
                <MenuDemo modal={modal} />
                <ExampleCombobox />
              </div>
              <DialogControls>
                <DialogCloseButton>Cancel</DialogCloseButton>
              </DialogControls>
            </DialogPopup>
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
          render={<Tooltip.Trigger render={<Trigger />} />}
          nativeButton
        >
          <Select.Value />
          <SelectDropdownArrow />
        </Select.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={10} render={<TooltipPositioner />}>
            <Tooltip.Popup render={<TooltipPopup />}>Choose a font</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>

      <Select.Portal>
        <Select.Positioner sideOffset={5} render={<Positioner />} alignItemWithTrigger={false}>
          <SelectPopup>
            <SelectItem value="system">
              <SelectItemIndicator render={<CheckIcon />} />
              <Select.ItemText>System font</Select.ItemText>
            </SelectItem>
            <SelectItem value="arial">
              <SelectItemIndicator render={<CheckIcon />} />
              <Select.ItemText>Arial</Select.ItemText>
            </SelectItem>
            <SelectItem value="roboto">
              <SelectItemIndicator render={<CheckIcon />} />
              <Select.ItemText>Roboto</Select.ItemText>
            </SelectItem>
          </SelectPopup>
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
      <Menu.Trigger render={<Trigger />}>Format</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="start" sideOffset={6} render={<Positioner />}>
          <MenuPopup>
            <Menu.SubmenuRoot closeParentOnEsc={false}>
              <SubmenuTrigger>Text color</SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner align="start" side="right" sideOffset={12} render={<Positioner />}>
                  <MenuPopup>
                    <MenuItem onClick={createHandleMenuClick('Text color/Black')}>Black</MenuItem>
                    <MenuItem onClick={createHandleMenuClick('Text color/Dark grey')}>
                      Dark grey
                    </MenuItem>
                    <MenuItem onClick={createHandleMenuClick('Text color/Accent')}>Accent</MenuItem>
                  </MenuPopup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>

            <Menu.SubmenuRoot>
              <SubmenuTrigger>Style</SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner align="start" side="right" sideOffset={12} render={<Positioner />}>
                  <MenuPopup>
                    <Menu.SubmenuRoot>
                      <SubmenuTrigger>Heading</SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner
                          align="start"
                          side="right"
                          sideOffset={12}
                          render={<Positioner />}
                        >
                          <MenuPopup>
                            <MenuItem onClick={createHandleMenuClick('Style/Heading/Level 1')}>
                              Level 1
                            </MenuItem>
                            <MenuItem onClick={createHandleMenuClick('Style/Heading/Level 2')}>
                              Level 2
                            </MenuItem>
                            <MenuItem onClick={createHandleMenuClick('Style/Heading/Level 3')}>
                              Level 3
                            </MenuItem>
                          </MenuPopup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.SubmenuRoot>
                    <MenuItem onClick={createHandleMenuClick('Style/Paragraph')}>
                      Paragraph
                    </MenuItem>
                    <Menu.Root disabled>
                      <SubmenuTrigger>List</SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner
                          align="start"
                          side="right"
                          sideOffset={12}
                          render={<Positioner />}
                        >
                          <MenuPopup>
                            <MenuItem onClick={createHandleMenuClick('Style/List/Ordered')}>
                              Ordered
                            </MenuItem>
                            <MenuItem onClick={createHandleMenuClick('Style/List/Unordered')}>
                              Unordered
                            </MenuItem>
                          </MenuPopup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.Root>
                  </MenuPopup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>

            <MenuItem onClick={createHandleMenuClick('Clear formatting')}>
              Clear formatting
            </MenuItem>
          </MenuPopup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

interface Props {
  modal: boolean;
}

const blue = {
  50: '#F0F7FF',
  100: '#C2E0FF',
  200: '#99CCF3',
  300: '#66B2FF',
  400: '#3399FF',
  500: '#007FFF',
  600: '#0072E6',
  700: '#0059B3',
  800: '#004C99',
  900: '#003A75',
};

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
};

const Trigger = styled('button')`
  font-family: 'IBM Plex Sans', sans-serif;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-radius: 5px;
  background-color: black;
  color: white;
  border: none;
  font-size: 100%;
  line-height: 1.5;
  user-select: none;
  cursor: default;

  &:hover {
    background-color: ${blue[600]};
  }

  &:focus-visible {
    outline: 2px solid black;
    outline-offset: 2px;
  }
`;

const SelectDropdownArrow = styled(Select.Icon)`
  margin-left: 6px;
  font-size: 10px;
  line-height: 1;
  height: 6px;
`;

const Positioner = styled('div')`
  &:focus-visible {
    outline: 0;
  }
`;

const SelectPopup = styled(Select.Popup)`
  overflow-y: auto;
  background-color: white;
  padding: 6px;
  border-radius: 5px;
  box-shadow:
    0 2px 4px rgb(0 0 0 / 0.1),
    0 0 0 1px rgb(0 0 0 / 0.1);
  max-height: var(--available-height);
  min-width: min(calc(var(--available-width) - 12px), calc(var(--anchor-width) + 20px));
  scroll-padding: 4px;

  &[data-side='none'] {
    scroll-padding: 15px;
  }

  --padding: 6px;
  --icon-size: 16px;
  --icon-margin: 4px;
`;

const SelectItem = styled(Select.Item)`
  outline: 0;
  cursor: default;
  border-radius: 4px;
  user-select: none;
  display: flex;
  align-items: center;
  line-height: 1.5;
  padding-block: var(--padding);
  padding-inline: calc(var(--padding) + var(--icon-margin) + var(--icon-size));

  &[data-selected] {
    padding-left: var(--padding);
  }

  &[data-disabled] {
    opacity: 0.5;
  }

  &[data-highlighted] {
    background-color: black;
    color: white;
  }
`;

const SelectItemIndicator = styled(Select.ItemIndicator)`
  margin-right: var(--icon-margin);
  visibility: hidden;
  width: var(--icon-size);
  height: var(--icon-size);

  &[data-selected] {
    visibility: visible;
  }
`;

const MenuPopup = styled(Menu.Popup)(
  ({ theme }) => `
  position: relative;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  box-sizing: border-box;
  padding: 6px;
  min-width: 200px;
  border-radius: 12px;
  outline: 0;
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  box-shadow: 0 4px 30px ${theme.palette.mode === 'dark' ? grey[900] : grey[200]};
  transform-origin: var(--transform-origin);
  opacity: 1;
  transform: scale(1, 1);
  transition: opacity 100ms ease-in, transform 100ms ease-in;

  @starting-style {
    & {
      opacity: 0;
      transform: scale(0.8);
    }
  }

  &[data-exiting] {
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 200ms ease-in, transform 200ms ease-in;
  }
  `,
);

const MenuItem = styled(Menu.Item)(
  ({ theme }) => `
  list-style: none;
  padding: 8px;
  border-radius: 8px;
  cursor: default;
  user-select: none;

  &:last-of-type {
    border-bottom: none;
  }

  &:focus {
    outline: 3px solid ${theme.palette.mode === 'dark' ? blue[600] : blue[200]};
    background-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[100]};
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  }

  &.[data-disabled] {
    color: ${theme.palette.mode === 'dark' ? grey[700] : grey[400]};
  }
  `,
);

const SubmenuTrigger = styled(Menu.SubmenuTrigger)(
  ({ theme }) => `
  list-style: none;
  padding: 8px;
  border-radius: 8px;
  cursor: default;
  user-select: none;

  &:last-of-type {
    border-bottom: none;
  }

  &::after {
    content: '›';
    float: right;
  }

  &[data-popup-open] {
    background-color: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  }

  &:focus,
  &:hover {
    background-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[100]};
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  }

  &:focus-visible {
    outline: none;
  }

  &[data-disabled] {
    color: ${theme.palette.mode === 'dark' ? grey[700] : grey[400]};
  }
  `,
);

const DialogPopup = styled(Dialog.Popup)(
  ({ theme }) => `
  background: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[100]};
  min-width: 400px;
  border-radius: 4px;
  box-shadow: rgb(0 0 0 / 0.2) 0 18px 50px -10px;
  position: fixed;
  top: 50%;
  left: 50%;
  font-family: "IBM Plex Sans", sans-serif;
  transform: translate(-50%, -50%);
  padding: 16px;
`,
);

const DialogControls = styled('div')(
  ({ theme }) => `
  display: flex;
  flex-direction: row-reverse;
  background: ${theme.palette.mode === 'dark' ? grey[800] : grey[100]};
  gap: 8px;
  padding: 16px;
  margin: 32px -16px -16px;
`,
);

const DialogCloseButton = styled(Dialog.Close)(
  ({ theme }) => `
  background-color: transparent;
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[300] : grey[500]};
  color: ${theme.palette.mode === 'dark' ? grey[50] : grey[900]};
  padding: 8px 16px;
  border-radius: 4px;
  font-family: "IBM Plex Sans", sans-serif;
  min-width: 80px;

  &:hover {
    background-color: ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  }
`,
);

const TooltipPositioner = styled('div')``;

const TooltipPopup = styled('div')`
  box-sizing: border-box;
  font-size: 0.9375rem;
  line-height: 1.375rem;
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background-color: canvas;
  transform-origin: var(--transform-origin);
  transition:
    transform 150ms,
    opacity 150ms;

  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
    transform: scale(0.9);
  }

  &[data-instant] {
    transition-duration: 0ms;
  }

  @media (prefers-color-scheme: light) {
    outline: 1px solid var(--color-gray-200);
    box-shadow:
      0 10px 15px -3px var(--color-gray-200),
      0 4px 6px -4px var(--color-gray-200);
  }

  @media (prefers-color-scheme: dark) {
    outline: 1px solid var(--color-gray-300);
    outline-offset: -1px;
  }
`;

const Backdrop = styled('div')`
  background: rgb(0 0 0 / 0.35);
  position: fixed;
  inset: 0;
  backdrop-filter: blur(4px);
`;

function ExampleCombobox() {
  const id = React.useId();
  return (
    <Combobox.Root items={fruits}>
      <div className="relative flex flex-col gap-1 text-sm leading-5 font-medium text-gray-900">
        <label htmlFor={id}>Choose a fruit</label>
        <Combobox.Input
          placeholder="e.g. Apple"
          id={id}
          className="h-10 w-64 rounded-md font-normal border border-gray-200 pl-3.5 text-base text-gray-900 bg-[canvas] focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
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
          <Combobox.Popup className="w-[var(--anchor-width)] max-h-[min(var(--available-height),23rem)] max-w-[var(--available-width)] origin-[var(--transform-origin)] overflow-y-auto scroll-pt-2 scroll-pb-2 overscroll-contain rounded-md bg-[canvas] py-2 text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[side=none]:data-[ending-style]:transition-none data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style]:transition-none dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
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
