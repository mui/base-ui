import * as React from 'react';
import * as Tooltip from '@base_ui/react/Tooltip';
import { styled, keyframes, css } from '@mui/system';

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
`;

const scaleOut = keyframes`
  to {
    opacity: 0;
    transform: scale(0.9);
  }
`;

const blue = {
  400: '#3399FF',
  600: '#0072E6',
  800: '#004C99',
};

export const TooltipPopup = styled(Tooltip.Popup)`
  ${({ theme }) => css`
    font-family: 'IBM Plex Sans', sans-serif;
    background: ${theme.palette.mode === 'dark' ? 'white' : 'black'};
    color: ${theme.palette.mode === 'dark' ? 'black' : 'white'};
    padding: 4px 6px;
    border-radius: 4px;
    font-size: 95%;
    cursor: default;
    transform-origin: var(--transform-origin);

    &[data-transition] {
      transition-property: opacity, transform;
      transition-duration: 0.2s;
      opacity: 0;
      transform: scale(0.9);

      &[data-status='opening'] {
        opacity: 1;
        transform: scale(1);
      }

      &[data-instant] {
        transition-duration: 0s;
      }
    }

    &[data-animation] {
      animation: ${scaleIn} 0.2s;

      &[data-status='closing'] {
        animation: ${scaleOut} 0.2s forwards;
      }
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

export default function TooltipTransitionExperiment() {
  return (
    <div
      style={{
        width: 700,
        padding: 50,
        margin: '0 auto',
        fontFamily: '"IBM Plex Sans", sans-serif',
      }}
    >
      <h2>Transition With Group</h2>
      <div style={{ display: 'flex', gap: 5 }}>
        <Tooltip.Group closeDelay={200}>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <AnchorButton>Anchor</AnchorButton>
            </Tooltip.Trigger>
            <TooltipPopup data-transition sideOffset={7}>
              Tooltip
            </TooltipPopup>
          </Tooltip.Root>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <AnchorButton>Anchor</AnchorButton>
            </Tooltip.Trigger>
            <TooltipPopup data-transition sideOffset={7}>
              Tooltip
            </TooltipPopup>
          </Tooltip.Root>
        </Tooltip.Group>
      </div>
      <h2>Animation</h2>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <AnchorButton>Anchor</AnchorButton>
        </Tooltip.Trigger>
        <TooltipPopup data-animation sideOffset={7}>
          Tooltip
        </TooltipPopup>
      </Tooltip.Root>
    </div>
  );
}
