import * as React from 'react';
import { Switch as BaseSwitch, SwitchProps } from '@mui/base/Switch';
import { css, styled } from '@mui/system';

const StyledSwitch = styled(BaseSwitch)(css`
  font-size: 0;
  position: relative;
  display: inline-block;
  width: 34px;
  height: 20px;
  cursor: pointer;
  background: var(--Switch-background, var(--muidocs-palette-grey-300));
  border-radius: max(2px, var(--border-radius) * 4);
  transition: background-color ease 100ms;
  border: none;
  padding: 0;

  &[data-disabled] {
    opacity: 0.4;
    cursor: not-allowed;
  }

  $:hover {
    background: var(--Switch-hoverBackground, var(--muidocs-palette-grey-400));
  }

  &:focus-visible {
    border-radius: max(2px, var(--border-radius) * 4);
    outline: 3px solid var(--muidocs-palette-primary-300);
  }

  &[data-state='checked'] {
    background: var(--muidocs-palette-primary-500);
  }
`);

const StyledSwitchThumb = styled(BaseSwitch.Thumb)(css`
  display: block;
  width: 14px;
  height: 14px;
  left: 3px;
  border-radius: max(2px, var(--border-radius));
  background-color: #fff;
  position: relative;
  transition-property: left;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 120ms;

  &[data-state='checked'] {
    left: 17px;
    background-color: #fff;

    &:hover {
      background: var(--muidocs-palette-primary-700);
    }
  }
`);

const Switch = React.forwardRef(function Switch(
  props: SwitchProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  return (
    <StyledSwitch {...props} ref={ref}>
      <StyledSwitchThumb />
    </StyledSwitch>
  );
});

export default Switch;
