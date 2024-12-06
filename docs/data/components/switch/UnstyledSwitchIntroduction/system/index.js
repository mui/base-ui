'use client';
import * as React from 'react';
import { styled } from '@mui/system';
import { Switch as BaseSwitch } from '@base-ui-components/react/switch';

export default function UnstyledSwitchIntroduction() {
  return (
    <div>
      <Switch aria-label="Basic switch, on by default" defaultChecked>
        <Thumb />
      </Switch>
      <Switch aria-label="Basic switch, off by default">
        <Thumb />
      </Switch>
      <Switch aria-label="Disabled switch, on by default" defaultChecked disabled>
        <Thumb />
      </Switch>
      <Switch aria-label="Disabled switch, off by default" disabled>
        <Thumb />
      </Switch>
    </div>
  );
}
const blue = {
  200: '#99CCF3',
  500: '#007FFF',
  700: '#0059B2',
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

const Switch = styled(BaseSwitch.Root)(
  ({ theme }) => `
  width: 38px;
  height: 24px;
  margin: 10px;
  padding: 0;
  box-sizing: border-box;
  background: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[800] : grey[200]};
  border-radius: 24px;
  display: inline-block;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 120ms;
  box-shadow: inset 0px 1px 1px ${
    theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.05)'
  };

  &[data-disabled] {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:hover:not([data-disabled]) {
    background: ${theme.palette.mode === 'dark' ? grey[800] : grey[100]};
    border-color: ${theme.palette.mode === 'dark' ? grey[600] : grey[300]};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${theme.palette.mode === 'dark' ? blue[700] : blue[200]};
  }

  &[data-checked] {
    border: none;
    background: ${blue[500]};
  }

  &[data-checked]:not([data-disabled]):hover {
    background: ${blue[700]};
  }
  `,
);

const Thumb = styled(BaseSwitch.Thumb)(
  ({ theme }) => `
    box-sizing: border-box;
    border: 1px solid ${theme.palette.mode === 'dark' ? grey[800] : grey[200]};
    display: block;
    width: 16px;
    height: 16px;
    left: 4px;
    border-radius: 16px;
    background-color: #FFF;
    position: relative;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 120ms;
    box-shadow: 0px 1px 2px ${
      theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.1)'
    };

    &[data-checked] {
      left: 18px;
      background-color: #fff;
      box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.3);
    }
`,
);
