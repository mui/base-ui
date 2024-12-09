'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { styled } from '@mui/system';

export default function UnstyledTooltipIntroduction() {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <Tooltip.Provider closeDelay={100}>
        <Tooltip.Root>
          <AnchorButton aria-label="bold">B</AnchorButton>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={7}>
              <TooltipPopup>
                Bold
                <TooltipArrow />
              </TooltipPopup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
        <Tooltip.Root>
          <AnchorButton aria-label="italic">I</AnchorButton>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={7}>
              <TooltipPopup>
                Italic
                <TooltipArrow />
              </TooltipPopup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
        <Tooltip.Root>
          <AnchorButton aria-label="underline">U</AnchorButton>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={7}>
              <TooltipPopup>
                Underline
                <TooltipArrow />
              </TooltipPopup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  );
}

const blue = {
  400: '#3399FF',
  600: '#0072E6',
  800: '#004C99',
};

export const TooltipPopup = styled(Tooltip.Popup)`
  ${({ theme }) => `
    background: ${theme.palette.mode === 'dark' ? 'white' : 'black'};
    color: ${theme.palette.mode === 'dark' ? 'black' : 'white'};
    padding: 4px 6px;
    border-radius: 4px;
    font-size: 95%;
    cursor: default;
  `}
`;

export const AnchorButton = styled(Tooltip.Trigger)`
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

  &[aria-label='bold'] {
    font-weight: bold;
  }

  &[aria-label='italic'] {
    font-style: italic;
  }

  &[aria-label='underline'] {
    text-decoration: underline;
  }
`;

export const TooltipArrow = styled(Tooltip.Arrow)`
  ${({ theme }) => `
    width: 10px;
    height: 10px;
    transform: rotate(45deg);
    background: ${theme.palette.mode === 'dark' ? 'white' : 'black'};
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
  `}
`;
