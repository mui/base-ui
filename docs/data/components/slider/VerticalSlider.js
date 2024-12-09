'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { Slider } from '@base-ui-components/react/slider';
import { useTheme } from '@mui/system';
import classes from './vertical.module.css';

export default function VerticalSlider() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Slider.Root
        defaultValue={50}
        orientation="vertical"
        aria-labelledby="VolumeSliderLabel"
        className={classes.slider}
      >
        <Label
          id="VolumeSliderLabel"
          htmlFor=":slider-thumb-input-vertical:"
          className={classes.label}
        >
          Volume
        </Label>
        <Slider.Control className={classes.control}>
          <Slider.Track className={classes.track}>
            <Slider.Indicator className={classes.indicator} />
            <Slider.Thumb
              className={classes.thumb}
              inputId=":slider-thumb-input-vertical:"
            />
          </Slider.Track>
        </Slider.Control>
        <Slider.Value className={classes.output} />
      </Slider.Root>
    </div>
  );
}

function Label(props) {
  const { id, htmlFor, ...otherProps } = props;

  return <label id={id} htmlFor={htmlFor} {...otherProps} />;
}

Label.propTypes = {
  htmlFor: PropTypes.string,
  id: PropTypes.string,
};

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}
