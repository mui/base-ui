'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { styled, useTheme, Box } from '@mui/system';
import { Slider as BaseSlider } from '@base-ui-components/react/slider';

export default function UnstyledSliderIntroduction() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  return (
    <Box
      className={isDarkMode ? 'dark' : ''}
      sx={{ display: 'flex', flexDirection: 'column', gap: '4rem', width: 320 }}
    >
      <Slider defaultValue={50} aria-labelledby="VolumeSliderLabel">
        <Label id="VolumeSliderLabel" htmlFor=":slider-thumb-input:">
          Volume
        </Label>
        <SliderOutput />
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb inputId=":slider-thumb-input:" />
          </SliderTrack>
        </SliderControl>
      </Slider>
    </Box>
  );
}

function BaseLabel(props) {
  const { id, htmlFor, ...otherProps } = props;

  return <label id={id} htmlFor={htmlFor} {...otherProps} />;
}

BaseLabel.propTypes = {
  htmlFor: PropTypes.string,
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
  width: 100%;
  align-items: center;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const SliderOutput = styled(BaseSlider.Output)`
  text-align: right;
`;

const SliderControl = styled(BaseSlider.Control)`
  grid-column: 1/3;
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  height: 16px;
  border-radius: 9999px;
  touch-action: none;

  &[data-disabled] {
    cursor: not-allowed;
  }
`;

const SliderTrack = styled(BaseSlider.Track)`
  width: 100%;
  height: 2px;
  border-radius: 9999px;
  background-color: ${grey[400]};
  touch-action: none;

  .dark & {
    background-color: ${grey[700]};
  }
`;

const SliderIndicator = styled(BaseSlider.Indicator)`
  border-radius: 9999px;
  background-color: black;

  .dark & {
    background-color: ${grey[100]};
  }
`;

const SliderThumb = styled(BaseSlider.Thumb)`
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

  .dark & {
    background-color: ${grey[100]};
  }

  .dark &:focus-visible {
    outline-color: ${grey[300]};
    outline-width: 1px;
    outline-offset: 3px;
  }

  &[data-dragging] {
    background-color: pink;
  }

  &[data-disabled],
  .dark &[data-disabled] {
    background-color: ${grey[600]};
  }

  .dark &[data-dragging] {
    background-color: pink;
  }
`;

const Label = styled(BaseLabel)`
  cursor: unset;
  font-weight: bold;

  &[data-disabled] {
    color: ${grey[600]};
  }
`;
