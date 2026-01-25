'use client';
import * as React from 'react';
import { Slider } from '@base-ui/react/slider';
import styles from './index.module.css';

export default function RangeSlider() {
  const id = React.useId();
  return (
    <Slider.Root defaultValue={[25, 45]} className={styles.Root} aria-labelledby={id}>
      <label id={id} className={styles.Label}>
        Price range
      </label>
      <Slider.Value className={styles.Value} />
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb index={0} aria-label="Minimum price" className={styles.Thumb} />
          <Slider.Thumb index={1} aria-label="Maximum price" className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
