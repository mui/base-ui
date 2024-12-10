import * as React from 'react';
import { DirectionProvider } from '@base-ui-components/react/direction-provider';
import { Slider } from '@base-ui-components/react/slider';
import styles from './index.module.css';

export default function ExampleDirectionProvider() {
  return (
    <DirectionProvider direction="rtl">
      <Slider.Root defaultValue={25}>
        <Slider.Control className={styles.Control}>
          <Slider.Track className={styles.Track}>
            <Slider.Indicator className={styles.Indicator} />
            <Slider.Thumb className={styles.Thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </DirectionProvider>
  );
}
