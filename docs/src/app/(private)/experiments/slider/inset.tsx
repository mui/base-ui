'use client';
import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';
import '../../../../demo-theme.css';
import styles from './inset.module.css';

export default function InsetSliders() {
  return (
    <div
      style={{
        alignSelf: 'center',
        marginTop: '40vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}
    >
      <Slider.Root className={styles.Slider} defaultValue={25} inset>
        <Slider.Control className={styles.Control}>
          <Slider.Track className={styles.Track}>
            <Slider.Indicator className={styles.Indicator} />
            <Slider.Thumb className={styles.Thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  );
}
