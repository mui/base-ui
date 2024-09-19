'use client';
import * as React from 'react';
import * as Switch from '@base_ui/react/Switch';
import { useTheme } from '@mui/system';

export default function UnstyledSwitchIntroduction() {
  return (
    <div>
      <Switch.Root
        className="CustomSwitchIntroduction"
        aria-label="Basic switch, on by default"
        defaultChecked
      >
        <Switch.Thumb className="CustomSwitchIntroduction-thumb" />
      </Switch.Root>
      <Switch.Root
        className="CustomSwitchIntroduction"
        aria-label="Basic switch, off by default"
      >
        <Switch.Thumb className="CustomSwitchIntroduction-thumb" />
      </Switch.Root>
      <Switch.Root
        className="CustomSwitchIntroduction"
        aria-label="Disabled switch, on by default"
        defaultChecked
        disabled
      >
        <Switch.Thumb className="CustomSwitchIntroduction-thumb" />
      </Switch.Root>
      <Switch.Root
        className="CustomSwitchIntroduction"
        aria-label="Disabled switch, off by default"
        disabled
      >
        <Switch.Thumb className="CustomSwitchIntroduction-thumb" />
      </Switch.Root>
      <Styles />
    </div>
  );
}

const cyan = {
  50: '#E9F8FC',
  100: '#BDEBF4',
  200: '#99D8E5',
  300: '#66BACC',
  400: '#1F94AD',
  500: '#0D5463',
  600: '#094855',
  700: '#063C47',
  800: '#043039',
  900: '#022127',
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

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

function Styles() {
  // Replace this with your app logic for determining dark modes
  const isDarkMode = useIsDarkMode();

  return (
    <style>
      {`
      .CustomSwitchIntroduction {
        width: 38px;
        height: 24px;
        margin: 10px;
        padding: 0;
        box-sizing: border-box;
        background: ${isDarkMode ? grey[900] : grey[50]};
        border: 1px solid ${isDarkMode ? grey[800] : grey[200]};
        border-radius: 24px;
        display: inline-block;
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 120ms;
        box-shadow: inset 0px 1px 1px ${
          isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.05)'
        };
      }

      .CustomSwitchIntroduction[data-disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .CustomSwitchIntroduction:hover:not([data-disabled]) {
        background: ${isDarkMode ? grey[800] : grey[100]};
        border-color: ${isDarkMode ? grey[600] : grey[300]};
      }
    
      .CustomSwitchIntroduction:focus-visible {
        box-shadow: 0 0 0 3px ${isDarkMode ? cyan[700] : cyan[200]};
      }
    
      .CustomSwitchIntroduction[data-state="checked"] {
        border: none;
        background: ${cyan[500]};
      }
    
      .CustomSwitchIntroduction[data-state="checked"]:not([data-disabled]):hover {
        background: ${cyan[700]};
      }


      .CustomSwitchIntroduction-thumb {
        box-sizing: border-box;
        border: 1px solid ${isDarkMode ? grey[800] : grey[200]};
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
          isDarkMode ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.1)'
        };
      }

      .CustomSwitchIntroduction-thumb[data-state="checked"] {
        left: 18px;
        background-color: #fff;
        box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.3);
      }
    `}
    </style>
  );
}
