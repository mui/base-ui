import * as React from 'react';
import PropTypes from 'prop-types';
import * as BaseSlider from '@base_ui/react/Slider';
import { styled, useTheme } from '@mui/system';

export default function VerticalSlider() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Slider
        defaultValue={50}
        orientation="vertical"
        aria-labelledby="VolumeSliderLabel"
      >
        <Label id="VolumeSliderLabel">Volume</Label>
        <SliderTrack>
          <SliderThumb />
        </SliderTrack>
        <SliderOutput />
      </Slider>
    </div>
  );
}

function BaseLabel(props) {
  const { id, ...otherProps } = props;
  const { subitems, disabled } = BaseSlider.useSliderContext();

  const htmlFor = Array.from(subitems.values())
    .reduce((acc, item) => {
      return `${acc} ${item.inputId}`;
    }, '')
    .trim();

  return (
    <label id={id} htmlFor={htmlFor} data-disabled={disabled} {...otherProps} />
  );
}

BaseLabel.propTypes = {
  id: PropTypes.string,
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

const Slider = styled(BaseSlider.Root)`
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
`;

const SliderOutput = styled(BaseSlider.Output)`
  font-size: 1.125rem;
`;

const SliderTrack = styled(BaseSlider.Track)`
  display: flex;
  align-items: center;
  position: relative;
  width: 2px;
  height: 300px;
  border-radius: 9999px;
  touch-action: none;

  &::before {
    content: '';
    height: 100%;
    width: 2px;
    border-radius: 9999px;
    background-color: ${grey[400]};
    touch-action: none;
  }

  &[data-disabled] {
    cursor: not-allowed;
  }

  .dark &::before {
    background-color: ${grey[700]};
  }
`;

const SliderThumb = styled(BaseSlider.Thumb)`
  position: absolute;
  width: 16px;
  height: 16px;
  box-sizing: border-box;
  border-radius: 50%;
  background-color: black;
  transform: translateX(calc(-50% + 1px));
  touch-action: none;

  &:focus-visible {
    outline: 2px solid black;
    outline-offset: 2px;
  }

  .dark & {
    background-color: ${grey[300]};
  }

  .dark &:focus-visible {
    outline-color: ${grey[300]};
    outline-width: 1px;
    outline-offset: 3px;
  }

  &[data-dragging='true'] {
    background-color: pink;
  }

  &[data-disabled],
  .dark &[data-disabled] {
    background-color: ${grey[600]};
  }

  .dark &[data-dragging='true'] {
    background-color: pink;
  }
`;

const Label = styled(BaseLabel)`
  cursor: unset;
  font-weight: 700;
  font-size: 1rem;

  &[data-disabled='true'] {
    color: ${grey[600]};
  }
`;
