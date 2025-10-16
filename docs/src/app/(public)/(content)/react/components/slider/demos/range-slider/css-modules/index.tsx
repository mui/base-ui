import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';
import styles from './index.module.css';

export default function RangeSlider() {
  return (
    <Slider.Root defaultValue={[25, 45]}>
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb
            getAriaLabel={(index) => `range-slider-thumb-${index}`}
            index={0}
            className={styles.Thumb}
          />
          <Slider.Thumb
            getAriaLabel={(index) => `range-slider-thumb-${index}`}
            index={1}
            className={styles.Thumb}
          />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
