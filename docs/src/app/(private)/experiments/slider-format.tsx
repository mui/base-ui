'use client';
import * as React from 'react';
import { useTheme } from '@mui/system';
import { Slider } from '@base-ui-components/react/slider';
import c from './slider.module.css';

export default function UnstyledSliderIntroduction() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  return (
    <div
      className={isDarkMode ? 'dark' : ''}
      style={{ display: 'flex', flexDirection: 'column', gap: '4rem', width: 320 }}
    >
      <Slider.Root
        className={c.slider}
        defaultValue={[50, 75]}
        aria-labelledby="BudgetSliderLabel"
        format={{
          style: 'currency',
          currency: 'USD',
          currencyDisplay: 'name',
        }}
      >
        <Label
          id="BudgetSliderLabel"
          htmlFor=":slider-thumb-input:"
          className={c.label}
        >
          Budget
        </Label>
        <Slider.Value className={c.output}>
          {(_, values) => `$${values[0].toFixed(2)} - ${values[1].toFixed(2)} USD`}
        </Slider.Value>
        <Slider.Control className={c.control}>
          <Slider.Track className={c.track}>
            <Slider.Indicator className={c.indicator} />
            <Slider.Thumb className={c.thumb} inputId="thumb1" />
            <Slider.Thumb className={c.thumb} inputId="thumb2" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  );
}

function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { id, htmlFor, ...otherProps } = props;

  return <label id={id} htmlFor={htmlFor} {...otherProps} />;
}

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}
