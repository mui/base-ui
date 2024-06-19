import * as React from 'react';
import * as Popover from '@base_ui/react/Popover';
import { styled } from '@mui/system';

export default function UnstyledPopoverIntroduction() {
  return (
    <Popover.Root>
      <AnchorButton>Trigger</AnchorButton>
      <PopoverPositioner sideOffset={8}>
        <PopoverPopup>
          <PopoverTitle>Popover Title</PopoverTitle>
          <PopoverDescription>Popover Description</PopoverDescription>
          <PopoverArrow />
        </PopoverPopup>
      </PopoverPositioner>
    </Popover.Root>
  );
}

const blue = {
  400: '#3399FF',
  600: '#0072E6',
  800: '#004C99',
};

export const PopoverPositioner = styled(Popover.Positioner)`
  border-radius: 5px;

  &:focus-visible {
    outline: 1px solid ${blue[400]};
  }
`;

export const PopoverPopup = styled(Popover.Popup)`
  position: relative;
  background: white;
  color: black;
  border-radius: 5px;
  filter: drop-shadow(0 0.1rem 0.25rem rgb(0 10 20 / 0.25));
  outline: 0;
  min-width: 200px;
  padding: 8px 16px;
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
  &[data-state='open'] {
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
