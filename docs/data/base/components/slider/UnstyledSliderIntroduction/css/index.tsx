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
        <Slider.Track className="Slider-track">
          <Slider.Thumb className="Slider-thumb" />
        </Slider.Track>
      </Slider.Root>

      <Slider.Root
        className="Slider"
        defaultValue={30}
        aria-labelledby="BrightnessSliderLabel"
        disabled
      >
        <Label id="BrightnessSliderLabel" className="Slider-label">
          Brightness
        </Label>
        <Slider.Output className="Slider-output" />
        <Slider.Track className="Slider-track">
          <Slider.Thumb className="Slider-thumb" />
        </Slider.Track>
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
      grid-gap: 1rem;
    }

    .Slider-output {
      text-align: right;
    }

    .Slider-track {
      grid-column: 1/3;
      display: flex;
      align-items: center;
      position: relative;
      width: 100%;
      height: 16px;
      border-radius: 9999px;
      touch-action: none;
    }

    .Slider-track::before {
      content: '';
      width: 100%;
      height: 2px;
      border-radius: 9999px;
      background-color: gainsboro;
      touch-action: none;
    }

    .Slider-track[data-disabled] {
      cursor: not-allowed;
    }

    .Slider-thumb {
      position: absolute;
      width: 16px;
      height: 16px;
      box-sizing: border-box;
      border-radius: 50%;
      background-color: black;
      transform: translateX(-50%);
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
