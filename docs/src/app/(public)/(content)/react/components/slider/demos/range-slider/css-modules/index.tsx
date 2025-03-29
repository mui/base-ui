import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';
import styles from './index.module.css';

export default function ExampleSlider() {
  return (
    <Slider.Root defaultValue={[25, 45]}>
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb className={styles.Thumb} />
          <Slider.Thumb className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
