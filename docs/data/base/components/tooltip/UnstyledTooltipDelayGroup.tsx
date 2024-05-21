import * as React from 'react';
import * as Tooltip from '@base_ui/react/Tooltip';
import { styled } from '@mui/system';

export default function UnstyledTooltipDelayGroup() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Tooltip.Group closeDelay={200}>
        <Tooltip.Root>
          <AnchorButton>Anchor A</AnchorButton>
          <TooltipPopup sideOffset={5}>Tooltip A</TooltipPopup>
        </Tooltip.Root>
        <Tooltip.Root>
          <AnchorButton>Anchor B</AnchorButton>
          <TooltipPopup sideOffset={5}>Tooltip B</TooltipPopup>
        </Tooltip.Root>
      </Tooltip.Group>
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
  &[data-state='open'] {
    background: ${blue[800]};
  }
`;
