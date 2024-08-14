'use client';

import * as React from 'react';
import { useTheme } from '@mui/system';
import * as Slider from '@base_ui/react/Slider';

export default function UnstyledSliderIntroduction() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  return (
    <div
      className={isDarkMode ? 'dark' : ''}
      style={{ display: 'flex', flexDirection: 'column', gap: '4rem', width: 320 }}
    >
      <Slider.Root
        className="Slider"
        defaultValue={50}
        aria-labelledby="VolumeSliderLabel"
      >
        <Label id="VolumeSliderLabel" className="Slider-label">
          Volume
        </Label>
        <Slider.Output className="Slider-output" />
        <Slider.Control className="Slider-control">
          <Slider.Track className="Slider-track">
            <Slider.Indicator className="Slider-indicator" />
            <Slider.Thumb className="Slider-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Styles />
    </div>
  );
}

function Label(props: React.HTMLAttributes<HTMLLabelElement>) {
  const { id, ...otherProps } = props;
  const { subitems, disabled } = Slider.useSliderContext();

  const htmlFor = Array.from(subitems.values())
    .reduce((acc, item) => {
      return `${acc} ${item.inputId}`;
    }, '')
    .trim();

  return (
    <label id={id} htmlFor={htmlFor} data-disabled={disabled} {...otherProps} />
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

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

function Styles() {
  return (
    <style suppressHydrationWarning>{`
    .Slider {
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 1rem;
      width: 100%;
      align-items: center;
      position: relative;
      -webkit-tap-highlight-color: transparent;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .Slider-output {
      text-align: right;
    }

    .Slider-control {
      grid-column: 1/3;
      display: flex;
      align-items: center;
      position: relative;
      width: 100%;
      height: 16px;
      border-radius: 9999px;
      touch-action: none;
    }

    .Slider-track {
      width: 100%;
      height: 2px;
      border-radius: 9999px;
      background-color: ${grey[400]};
      touch-action: none;
    }

    .dark .Slider-track {
      background-color: ${grey[700]};
    }

    .Slider-control[data-disabled] {
      cursor: not-allowed;
    }

    .Slider-indicator {
      height: 2px;
      border-radius: 9999px;
      background-color: black;
    }

    .dark .Slider-indicator {
      background-color: ${grey[100]};
    }

    .Slider-thumb {
      width: 16px;
      height: 16px;
      box-sizing: border-box;
      border-radius: 50%;
      background-color: black;
      touch-action: none;

      &:focus-visible {
        outline: 2px solid black;
        outline-offset: 2px;
      }

      &[data-dragging] {
        background-color: pink;
      }

      &[data-disabled] {
        background-color: ${grey[300]};
      }
    }

    .dark .Slider-thumb {
      background-color: ${grey[100]};

      &:focus-visible {
        outline-color: ${grey[300]};
        outline-width: 1px;
        outline-offset: 3px;
      }

      &[data-disabled] {
        background-color: ${grey[600]};
      }
    }

    .Slider-label {
      cursor: unset;
      font-weight: bold;
    }

    .Slider-label[data-disabled='true'] {
      color: ${grey[600]};
    }
    `}</style>
  );
}
