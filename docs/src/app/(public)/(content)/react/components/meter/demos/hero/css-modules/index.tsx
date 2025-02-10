import * as React from 'react';
import { Meter } from '@base-ui-components/react/meter';
import styles from './index.module.css';

export default function ExampleMeter() {
  return (
    <Meter.Root value={80}>
      <Meter.Track className={styles.Track}>
        <Meter.Indicator className={styles.Indicator} />
      </Meter.Track>
    </Meter.Root>
  );
}
