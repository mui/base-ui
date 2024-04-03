import * as React from 'react';
import * as Tooltip from '@base_ui/react/Tooltip';
import { styled } from '@mui/system';

export default function UnstyledTooltipTransition() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <AnchorButton>Anchor</AnchorButton>
        </Tooltip.Trigger>
        <TooltipContent sideOffset={5}>Tooltip</TooltipContent>
      </Tooltip.Root>
    </div>
  );
}

const blue = {
  400: '#3399FF',
  600: '#0072E6',
  800: '#004C99',
};

export const TooltipContent = styled(Tooltip.Content)`
  ${({ theme }) => `
    background: ${theme.palette.mode === 'dark' ? 'white' : 'black'};
    color: ${theme.palette.mode === 'dark' ? 'black' : 'white'};
    padding: 4px 6px;
    border-radius: 4px;
    font-size: 95%;
    cursor: default;
    transition-property: opacity, transform;
    transition-duration: 0.2s;
    opacity: 0;
    transform: scale(0.9);
    transform-origin: var(--transform-origin);

    &[data-status='opening'] {
      opacity: 1;
      transform: scale(1);
    }
  `}
`;

export const AnchorButton = styled('button')`
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
