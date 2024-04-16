import * as React from 'react';
import * as Checkbox from '@base_ui/react/Checkbox';
import { useTheme } from '@mui/system';
import Check from '@mui/icons-material/Check';

export default function UnstyledCheckboxIntroduction() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Checkbox.Root
        className="Checkbox"
        aria-label="Basic checkbox, on by default"
        defaultChecked
      >
        <Checkbox.Indicator className="Checkbox-indicator">
          <Check className="Checkbox-icon" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <Checkbox.Root
        className="Checkbox"
        aria-label="Basic checkbox, off by default"
      >
        <Checkbox.Indicator className="Checkbox-indicator">
          <Check className="Checkbox-icon" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <Checkbox.Root
        className="Checkbox"
        aria-label="Disabled checkbox, on by default"
        defaultChecked
        disabled
      >
        <Checkbox.Indicator className="Checkbox-indicator">
          <Check className="Checkbox-icon" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <Checkbox.Root
        className="Checkbox"
        aria-label="Disabled checkbox, off by default"
        disabled
      >
        <Checkbox.Indicator className="Checkbox-indicator">
          <Check className="Checkbox-icon" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <Styles />
    </div>
  );
}

const grey = {
  100: '#E5EAF2',
  300: '#C7D0DD',
  500: '#9DA8B7',
  600: '#6B7A90',
  800: '#303740',
  900: '#1C2025',
};

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

function Styles() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();

  return (
    <style>
      {`
      .Checkbox {
        all: unset;
        box-sizing: border-box;
        text-align: center;
        width: 24px;
        height: 24px;
        padding: 0;
        border-radius: 4px;
        border: 2px solid ${grey[600]};
        background: none;
        transition-property: background, border-color;
        transition-duration: 0.15s;
      }

      .Checkbox[data-disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .Checkbox:focus-visible {
        outline: 2px solid ${isDarkMode ? grey[600] : grey[500]};
        outline-offset: 2px;
      }

      .Checkbox[data-state="checked"] {
        border-color: ${grey[800]};
        background: ${grey[800]};
      }

      .Checkbox-indicator {
        height: 100%;
        display: inline-block;
        visibility: hidden;
        color: ${isDarkMode ? grey[900] : grey[100]};
      }

      .Checkbox-indicator[data-state="checked"] {
        visibility: visible;
      }

      .Checkbox-icon {
        width: 100%;
        height: 100%;
      }

      @media (prefers-color-scheme: dark) {
        .Checkbox {
          border-color: ${grey[500]};
        }

        .Checkbox[data-state="checked"] {
          border-color: ${grey[300]};
          background: ${grey[300]};
        }

        .Checkbox:hover:not([data-disabled]) {
          border-color: ${grey[100]};
        }

        .Checkbox-indicator {
          color: ${grey[900]};
        }
      }
    `}
    </style>
  );
}
