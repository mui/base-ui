'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { Slider } from '@base-ui-components/react/slider';
import { useTheme } from '@mui/system';
import classes from './styles.module.css';

export default function RtlSlider() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  return (
    <div className={isDarkMode ? 'dark' : ''} style={{ width: 320, margin: 32 }}>
      <Slider.Root
        defaultValue={50}
        aria-labelledby="VolumeSliderLabel"
        direction="rtl"
        className={classes.slider}
      >
        <Label
          id="VolumeSliderLabel"
          htmlFor=":slider-thumb-input-rtl:"
          className={classes.label}
        >
          Volume (RTL)
        </Label>
        <Slider.Output className={classes.output} />
        <Slider.Control className={classes.control}>
          <Slider.Track className={classes.track}>
            <Slider.Indicator className={classes.indicator} />
            <Slider.Thumb
              className={classes.thumb}
              inputId=":slider-thumb-input-rtl:"
            />
          </Slider.Track>
        </Slider.Control>
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
