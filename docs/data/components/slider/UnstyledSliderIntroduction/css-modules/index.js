'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/system';
import { Slider } from '@base-ui-components/react/slider';
import classes from '../../styles.module.css';

export default function UnstyledSliderIntroduction() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  return (
    <div
      className={isDarkMode ? 'dark' : ''}
      style={{ display: 'flex', flexDirection: 'column', gap: '4rem', width: 320 }}
    >
      <Slider.Root
        className={classes.slider}
        defaultValue={50}
        aria-labelledby="VolumeSliderLabel"
      >
        <Label
          id="VolumeSliderLabel"
          htmlFor=":slider-thumb-input:"
          className={classes.label}
        >
          Volume
        </Label>
        <Slider.Value className={classes.output} />
        <Slider.Control className={classes.control}>
          <Slider.Track className={classes.track}>
            <Slider.Indicator className={classes.indicator} />
            <Slider.Thumb className={classes.thumb} inputId=":slider-thumb-input:" />
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
