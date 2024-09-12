'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import * as Slider from '@base_ui/react/Slider';
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
        <Label id="VolumeSliderLabel" className={classes.label}>
          Volume
        </Label>
        <Slider.Control className={classes.control}>
          <Slider.Track className={classes.track}>
            <Slider.Indicator className={classes.indicator} />
            <Slider.Thumb className={classes.thumb} />
          </Slider.Track>
        </Slider.Control>
        <Slider.Output className={classes.output} />
      </Slider.Root>
    </div>
  );
}

function Label(props) {
  const { id, ...otherProps } = props;
  const { inputIdMap, disabled } = Slider.useSliderContext();

  const htmlFor = inputIdMap.get(0);

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
