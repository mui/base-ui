'use client';
import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { styled } from '@mui/system';

export default function UnstyledPopoverIntroduction() {
  return (
    <Popover.Root>
      <AnchorButton>Trigger</AnchorButton>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <PopoverPopup>
            <PopoverTitle>Popover Title</PopoverTitle>
            <PopoverDescription>Popover Description</PopoverDescription>
            <PopoverArrow />
          </PopoverPopup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

const blue = {
  400: '#3399FF',
  600: '#0072E6',
  800: '#004C99',
};

export const PopoverPopup = styled(Popover.Popup)`
  position: relative;
  background: white;
  color: black;
  border-radius: 5px;
  filter: drop-shadow(0 2px 4px rgb(0 10 20 / 0.25));
  outline: 0;
  padding: 8px 16px;
`;

export const PopoverTitle = styled(Popover.Title)`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 0;
`;

export const PopoverDescription = styled(Popover.Description)`
  margin-top: 12px;
`;

export const AnchorButton = styled(Popover.Trigger)`
  border: none;
  background: ${blue[600]};
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 16px;

  &:focus-visible {
    outline: 2px solid ${blue[400]};
    outline-offset: 2px;
  }

  &:hover,
  &[data-popup-open] {
    background: ${blue[800]};
  }
`;

export const PopoverArrow = styled(Popover.Arrow)`
  width: 10px;
  height: 10px;
  transform: rotate(45deg);
  background: white;
  z-index: -1;

  &[data-side='top'] {
    bottom: -5px;
  }

  &[data-side='right'] {
    left: -5px;
  }

  &[data-side='bottom'] {
    top: -5px;
  }

  &[data-side='left'] {
    right: -5px;
  }
`;
