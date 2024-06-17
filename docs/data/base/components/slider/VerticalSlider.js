import * as React from 'react';
import PropTypes from 'prop-types';
import * as Slider from '@base_ui/react/Slider';
import { useTheme } from '@mui/system';

export default function VerticalSlider() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Slider.Root
        defaultValue={50}
        orientation="vertical"
        aria-labelledby="VolumeSliderLabel"
        className="VerticalSlider"
      >
        <Label id="VolumeSliderLabel" className="Label">
          Volume
        </Label>
        <Slider.Control className="VerticalSlider-control">
          <Slider.Indicator className="VerticalSlider-indicator" />
          <Slider.Thumb className="VerticalSlider-thumb" />
        </Slider.Control>
        <Slider.Output className="VerticalSlider-output" />
      </Slider.Root>
      <Styles />
    </div>
  );
}

function Label(props) {
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

Label.propTypes = {
  id: PropTypes.string,
};

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

function Styles() {
  return (
    <style suppressHydrationWarning>{`
      .VerticalSlider {
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 1rem;
        height: 100%;
        width: 5rem;
        align-items: center;
        position: relative;
        -webkit-tap-highlight-color: transparent;
        display: flex;
        flex-flow: column-reverse nowrap;
        gap: 1rem;
      }

      .VerticalSlider-output {
        font-size: 1.125rem;
      }

      .VerticalSlider-control {
        display: flex;
        flex-flow: column nowrap;
        align-items: center;
        position: relative;
        width: 16px;
        height: 300px;
        border-radius: 9999px;
        touch-action: none;
      }

      .VerticalSlider-control:before {
        content: '';
        height: 100%;
        width: 2px;
        border-radius: 9999px;
        background-color: ${grey[400]};
        touch-action: none;
      }

      .VerticalSlider-control[data-disabled='true'] {
        cursor: not-allowed;
      }

      .dark .VerticalSlider-control:before {
        background-color: ${grey[700]};
      }

      .VerticalSlider-indicator {
        width: 2px;
        border-radius: 9999px;
        background-color: black;
      }

      .dark .VerticalSlider-indicator {
        background-color: ${grey[100]};
      }

      .VerticalSlider-thumb {
        position: absolute;
        width: 16px;
        height: 16px;
        box-sizing: border-box;
        border-radius: 50%;
        background-color: black;
        transform: translateY(50%);
        touch-action: none;
      }

      .VerticalSlider-thumb[data-dragging='true'],
      .dark .VerticalSlider-thumb[data-dragging='true'] {
        background-color: pink;
      }

      .dark .VerticalSlider-thumb {
        background-color: ${grey[100]};
      }

      .VerticalSlider-thumb:focus-visible {
        outline: 2px solid black;
        outline-offset: 2px;
      }

      .dark .VerticalSlider-thumb:focus-visible {
        outline-color: ${grey[300]};
        outline-width: 1px;
        outline-offset: 3px;
      }

      .VerticalSlider-thumb[data-disabled='true'] {
        background-color: ${grey[600]};
      }

      .Label {
        cursor: unset;
        font-weight: 700;
        font-size: 1rem;
        color: inherit;
      }

      .Label[data-disabled='true'] {
        color: ${grey[600]};
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
