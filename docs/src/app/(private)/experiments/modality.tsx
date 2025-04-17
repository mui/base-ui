'use client';

import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { Menu } from '@base-ui-components/react/menu';
import { Dialog } from '@base-ui-components/react/dialog';
import { styled } from '@mui/system';

export default function Modality() {
  const [modal, setModal] = React.useState(true);
  const [withBackdrop, setWithBackdrop] = React.useState(false);

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
      <SelectDemo modal={modal} withBackdrop={withBackdrop} />
      <MenuDemo modal={modal} withBackdrop={withBackdrop} />
      <DialogDemo modal={modal} withBackdrop={withBackdrop} />
    </div>
  );
}

function SelectDemo({ modal, withBackdrop }: Props) {
  return (
    <Select.Root defaultValue="system" modal={modal} alignItemToTrigger={false}>
      <Select.Trigger aria-label="Select font" render={<Trigger />}>
        <Select.Value placeholder="System font" />
        <SelectDropdownArrow />
      </Select.Trigger>

      {withBackdrop && <Select.Backdrop render={<Backdrop />} />}

      <Select.Portal>
        <Select.Positioner sideOffset={5} render={<Positioner />}>
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

function MenuDemo({ modal, withBackdrop }: Props) {
  return (
    <Menu.Root modal={modal}>
      <Menu.Trigger render={<Trigger />}>Open Menu</Menu.Trigger>

      {withBackdrop && <Menu.Backdrop render={<Backdrop />} />}

      <Menu.Portal>
        <Menu.Positioner align="start" sideOffset={8} render={<Positioner />}>
          <MenuPopup>
            <MenuItem onClick={() => console.log('Log out clicked')}>
              Log out
            </MenuItem>
          </MenuPopup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function DialogDemo({ modal, withBackdrop }: Props) {
  return (
    <Dialog.Root modal={modal}>
      <Dialog.Trigger render={<Trigger />}>Open Dialog</Dialog.Trigger>

      {withBackdrop && <Dialog.Backdrop render={<Backdrop />} />}

      <Dialog.Portal>
        <DialogPopup>
          <Dialog.Title>Subscribe</Dialog.Title>
          <Dialog.Description>
            Enter your email address to subscribe to our newsletter.
          </Dialog.Description>
          <DialogControls>
            <DialogCloseButton>Subscribe</DialogCloseButton>
            <DialogCloseButton>Cancel</DialogCloseButton>
          </DialogControls>
        </DialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface Props {
  modal: boolean;
  withBackdrop: boolean;
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

const CheckIcon = styled(function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
        fill="currentColor"
      />
    </svg>
  );
})`
  width: 100%;
  height: 100%;
`;

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
  z-index: 2001;

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
  min-width: min(
    calc(var(--available-width) - 12px),
    calc(var(--anchor-width) + 20px)
  );
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
  z-index: 1;
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
  z-index: 2100;
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

const Backdrop = styled('div')`
  background: rgb(0 0 0 / 0.35);
  position: fixed;
  inset: 0;
  backdrop-filter: blur(4px);
  z-index: 2000;
`;
