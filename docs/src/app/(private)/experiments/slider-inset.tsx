'use client';
import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';
import '../../../demo-theme.css';
import styles from './slider.inset.module.css';

export default function InsetSlider() {
  return (
    <div style={{ alignSelf: 'center', marginTop: '40vh' }}>
      <Slider.Root className={styles.Slider} defaultValue={25}>
        <Slider.Track className={styles.Track}>
          <Slider.Control className={styles.Control}>
            <Slider.Indicator className={styles.Indicator} />
            <Slider.Thumb className={styles.Thumb} />
          </Slider.Control>
        </Slider.Track>
      </Slider.Root>
    </div>
  );
}
