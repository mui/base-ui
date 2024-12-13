'use client';
import * as React from 'react';
import { useTheme } from '@mui/system';
import { Slider } from '@base-ui-components/react/slider';
import classes from './styles.module.css';

export default function RangeSlider() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  const [value, setValue] = React.useState([20, 37]);

  return (
    <div
      className={isDarkMode ? 'dark' : ''}
      style={{ display: 'flex', flexDirection: 'column', gap: '4rem', width: 320 }}
    >
      {/* controlled: */}
      <Slider.Root
        value={value}
        onValueChange={setValue}
        aria-labelledby="ControlledRangeLabel"
        className={classes.slider}
      >
        {/*
           we can't use a <label> element in a range slider since the `for` attribute
           cannot reference more than one <input> element
           although the html spec doesn't forbid <label> without `for`:
           https://html.spec.whatwg.org/multipage/forms.html#the-label-element
           eslint complains by default and a11y validators may complain e.g. WAVE
          */}
        <span id="ControlledRangeLabel" className={classes.label}>
          Controlled Range
        </span>
        <Slider.Value className={classes.output} />
        <Slider.Control className={classes.control}>
          <Slider.Track className={classes.track}>
            <Slider.Indicator className={classes.indicator} />
            <Slider.Thumb className={classes.thumb} />
            <Slider.Thumb className={classes.thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      {/* uncontrolled: */}
      <Slider.Root
        defaultValue={[20, 37]}
        aria-labelledby="UncontrolledRangeLabel"
        className={classes.slider}
      >
        <span id="UncontrolledRangeLabel" className={classes.label}>
          Uncontrolled Range
        </span>
        <Slider.Value className={classes.output} />
        <Slider.Control className={classes.control}>
          <Slider.Track className={classes.track}>
            <Slider.Indicator className={classes.indicator} />
            <Slider.Thumb className={classes.thumb} />
            <Slider.Thumb className={classes.thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  );
}

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}
