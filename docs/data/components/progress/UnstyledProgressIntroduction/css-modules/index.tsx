'use client';
import * as React from 'react';
import { useTheme } from '@mui/system';
import { Progress } from '@base_ui/react/Progress';

export default function UnstyledProgressIntroduction() {
  return (
    <div className="App">
      <Progress.Root className="Progress" value={50} aria-labelledby="ProgressLabel">
        <span className="Label" id="ProgressLabel">
          Uploading files
        </span>
        <Progress.Track className="Progress-track">
          <Progress.Indicator className="Progress-indicator" />
        </Progress.Track>
      </Progress.Root>
      <Styles />
    </div>
  );
}

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

export function Styles() {
  const isDarkMode = useIsDarkMode();
  return (
    <style>{`
      .App {
        font-family: system-ui, sans-serif;
        width: 20rem;
        padding: 1rem;
      }

      .Progress {
        display: flex;
        flex-flow: column nowrap;
        gap: 1rem;
      }

      .Progress-track {
        position: relative;
        width: 100%;
        height: 4px;
        border-radius: 9999px;
        background-color: ${grey[400]};
        display: flex;
        overflow: hidden;
      }

      .Progress-indicator {
        background-color: ${isDarkMode ? BLUE400 : BLUE500};
        border-radius: inherit;
      }

      .Label {
        cursor: unset;
        font-weight: bold;
      }
    `}</style>
  );
}

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

const BLUE400 = '#3399FF';
const BLUE500 = '#007FFF';
