'use client';
import * as React from 'react';
import { useTheme } from '@mui/system';
import * as Slider from '@base_ui/react/Slider';
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
        <Label id="VolumeSliderLabel" className={classes.label}>
          Volume
        </Label>
        <Slider.Output className={classes.output} />
        <Slider.Control className={classes.control}>
          <Slider.Track className={classes.track}>
            <Slider.Indicator className={classes.indicator} />
            <Slider.Thumb className={classes.thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  );
}

function Label(props: React.HTMLAttributes<HTMLLabelElement>) {
  const { id, ...otherProps } = props;
  const { inputIdMap, disabled } = Slider.useSliderContext();

  const htmlFor = inputIdMap.get(0);

  return (
    <label id={id} htmlFor={htmlFor} data-disabled={disabled} {...otherProps} />
  );
}

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}
