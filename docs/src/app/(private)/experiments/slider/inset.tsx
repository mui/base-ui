'use client';
import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';
import '../../../../demo-theme.css';
import macStyles from './inset.mac.module.css';
import nativeStyles from './inset.native.module.css';

const styles = {
  mac: macStyles,
  native: nativeStyles,
};

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
      <Slider.Root className={styles.mac.Slider} defaultValue={25}>
        <Slider.Control className={styles.mac.Control}>
          <Slider.Track className={styles.mac.Track}>
            <Slider.Indicator className={styles.mac.Indicator} />
            <Slider.Thumb className={styles.mac.Thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root className={styles.native.Slider} defaultValue={25}>
        <Slider.Control className={styles.native.Control}>
          <Slider.Track className={styles.native.Track}>
            <Slider.Indicator className={styles.native.Indicator} />
            <Slider.Thumb className={styles.native.Thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  );
}
