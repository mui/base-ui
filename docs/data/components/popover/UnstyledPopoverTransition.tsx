'use client';
import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { styled } from '@mui/system';

export default function UnstyledPopoverTransition() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Popover.Root>
        <AnchorButton>Trigger</AnchorButton>
        <Popover.Portal>
          <Popover.Positioner sideOffset={5}>
            <PopoverPopup>
              <PopoverTitle>Popover Title</PopoverTitle>
              <PopoverDescription>Popover Description</PopoverDescription>
            </PopoverPopup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
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
  filter: drop-shadow(0 0.1rem 0.25rem rgb(0 10 20 / 0.25));
  outline: 0;
  min-width: 200px;
  padding: 8px 16px;
  transition-property: opacity, transform;
  transition-duration: 0.2s;
  opacity: 0;
  transform: scale(0.9);
  transform-origin: var(--transform-origin);

  &[data-open] {
    opacity: 1;
    transform: scale(1);
  }

  &[data-starting-style] {
    opacity: 0;
    transform: scale(0.9);
  }
`;

export const PopoverTitle = styled(Popover.Title)`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 0;
`;

export const PopoverDescription = styled('p')`
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
