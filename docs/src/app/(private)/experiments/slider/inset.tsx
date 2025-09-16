'use client';
import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';
import '../../../../demo-theme.css';
import styles from './inset.module.css';

export default function InsetSliders() {
  return (
    <React.Fragment>
      <p style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
        Blue: <code>`renderBeforeHydration=&#123;false&#125;`</code>
        <br />
        Red: <code>`renderBeforeHydration=&#123;true&#125;`</code>
      </p>
      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',

          alignSelf: 'flex-start',
          marginLeft: '20px',
        }}
      >
        <Slider.Root className={styles.Slider} defaultValue={30} min={0} max={100} inset>
          <Slider.Control className={styles.Control}>
            <Slider.Track className={styles.Track}>
              <Slider.Indicator className={styles.Indicator} />
              <Slider.Thumb className={styles.Thumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>

        <Slider.Root
          className={styles.Slider}
          defaultValue={30}
          min={0}
          max={100}
          inset
          renderBeforeHydration
          style={{ ['--base-color' as string]: 'var(--color-red)' }}
        >
          <Slider.Control className={styles.Control}>
            <Slider.Track className={styles.Track}>
              <Slider.Indicator className={styles.Indicator} />
              <Slider.Thumb className={styles.Thumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>

        <Slider.Root className={styles.Slider} defaultValue={[20, 64]} min={0} max={100} inset>
          <Slider.Control className={styles.Control}>
            <Slider.Track className={styles.Track}>
              <Slider.Indicator className={styles.Indicator} />
              <Slider.Thumb index={0} className={styles.Thumb} />
              <Slider.Thumb index={1} className={styles.Thumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>

        <Slider.Root
          className={styles.Slider}
          defaultValue={[20, 64]}
          min={0}
          max={100}
          inset
          renderBeforeHydration
          style={{ ['--base-color' as string]: 'var(--color-red)' }}
        >
          <Slider.Control className={styles.Control}>
            <Slider.Track className={styles.Track}>
              <Slider.Indicator className={styles.Indicator} />
              <Slider.Thumb index={0} className={styles.Thumb} />
              <Slider.Thumb index={1} className={styles.Thumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>

        <Slider.Root
          className={styles.Slider}
          defaultValue={30}
          min={0}
          max={100}
          inset
          style={{ ['--track-width' as string]: '400px' }}
        >
          <Slider.Control className={styles.Control}>
            <Slider.Track className={styles.Track}>
              <Slider.Indicator className={styles.Indicator} />
              <Slider.Thumb className={styles.Thumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>

        <Slider.Root
          className={styles.Slider}
          defaultValue={30}
          min={0}
          max={100}
          inset
          renderBeforeHydration
          style={{
            ['--base-color' as string]: 'var(--color-red)',
            ['--track-width' as string]: '400px',
          }}
        >
          <Slider.Control className={styles.Control}>
            <Slider.Track className={styles.Track}>
              <Slider.Indicator className={styles.Indicator} />
              <Slider.Thumb className={styles.Thumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>

        <Slider.Root
          className={styles.Slider}
          defaultValue={[20, 60]}
          min={0}
          max={100}
          inset
          style={{ ['--track-width' as string]: '400px' }}
        >
          <Slider.Control className={styles.Control}>
            <Slider.Track className={styles.Track}>
              <Slider.Indicator className={styles.Indicator} />
              <Slider.Thumb index={0} className={styles.Thumb} />
              <Slider.Thumb index={1} className={styles.Thumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>

        <Slider.Root
          className={styles.Slider}
          defaultValue={[20, 60]}
          min={0}
          max={100}
          inset
          renderBeforeHydration
          style={{
            ['--base-color' as string]: 'var(--color-red)',
            ['--track-width' as string]: '400px',
          }}
        >
          <Slider.Control className={styles.Control}>
            <Slider.Track className={styles.Track}>
              <Slider.Indicator className={styles.Indicator} />
              <Slider.Thumb index={0} className={styles.Thumb} />
              <Slider.Thumb index={1} className={styles.Thumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </div>
    </React.Fragment>
  );
}
