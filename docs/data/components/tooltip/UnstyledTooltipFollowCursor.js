'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { styled } from '@mui/system';

export default function UnstyledTooltipFollowCursor() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Tooltip.Root trackCursorAxis="both">
        <AnchorButton>Anchor</AnchorButton>
        <Tooltip.Positioner sideOffset={5}>
          <TooltipPopup>Tooltip</TooltipPopup>
        </Tooltip.Positioner>
      </Tooltip.Root>
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
`;
