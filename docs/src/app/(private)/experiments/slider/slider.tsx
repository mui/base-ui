'use client';
import * as React from 'react';
import { Slider } from '@base-ui-components/react/slider';
import { DirectionProvider } from '@base-ui-components/react/direction-provider';
import {
  SettingsMetadata,
  useExperimentSettings,
} from '../../../../components/Experiments/SettingsPanel';
import '../../../../demo-theme.css';
import styles from './slider.module.css';
import verticalStyles from './vertical.module.css';
import smallStyles from './small.module.css';

interface Settings extends Record<string, boolean> {}

export const settingsMetadata: SettingsMetadata<Settings> = {
  rtl: {
    type: 'boolean',
    label: 'RTL',
    default: false,
  },
};

function DelayUntilRepeat() {
  // small numeric range with a small number of steps
  return (
    <Slider.Root
      defaultValue={0}
      min={0}
      max={5}
      step={1}
      className={smallStyles.Root}
      aria-labelledby="label-5"
    >
      <span className={smallStyles.Label} id="label-5">
        Delay until repeat
      </span>
      <Slider.Control className={smallStyles.Control}>
        <Slider.Track className={smallStyles.Track}>
          <span className={smallStyles.Mark} />
          <span className={smallStyles.Mark} />
          <span className={smallStyles.Mark} />
          <span className={smallStyles.Mark} />
          <span className={smallStyles.Mark} />
          <span className={smallStyles.Mark} />
          <Slider.Thumb
            /* getAriaValueText could be used so more meaningful values are announced  */
            className={smallStyles.Thumb}
          />
        </Slider.Track>
      </Slider.Control>
      <small className={smallStyles.Small}>Long</small>
      <small className={smallStyles.Small}>Short</small>
    </Slider.Root>
  );
}

function Volume() {
  return (
    <Slider.Root
      defaultValue={0}
      min={0}
      max={100}
      step={1}
      className={styles.Root}
      aria-labelledby="label-1"
    >
      <span className={styles.Label} id="label-1">
        Volume
      </span>
      <Slider.Value className={styles.Value} />
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}

function Brightness() {
  return (
    <Slider.Root
      defaultValue={0}
      min={0}
      max={100}
      step={1}
      className={verticalStyles.Root}
      aria-labelledby="label-2"
      orientation="vertical"
    >
      <Slider.Value className={verticalStyles.Value} />
      <Slider.Control className={verticalStyles.Control}>
        <Slider.Track className={verticalStyles.Track}>
          <Slider.Indicator className={verticalStyles.Indicator} />
          <Slider.Thumb className={verticalStyles.Thumb} />
        </Slider.Track>
      </Slider.Control>
      <span className={verticalStyles.Label} id="label-2">
        Brightness
      </span>
    </Slider.Root>
  );
}

function PriceRange() {
  return (
    <Slider.Root
      defaultValue={[20000, 30000]}
      min={7000}
      max={70000}
      step={1}
      minStepsBetweenValues={100}
      className={styles.Root}
      aria-labelledby="label-3"
      format={{
        style: 'currency',
        currency: 'JPY',
      }}
      style={{ width: '18rem' }}
    >
      <span className={styles.Label} id="label-3">
        Price Range
      </span>
      <Slider.Value className={styles.Value} />
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

function TemperatureRange() {
  return (
    <Slider.Root
      defaultValue={[20, 24]}
      min={10}
      max={32}
      step={0.5}
      orientation="vertical"
      className={verticalStyles.Root}
      aria-labelledby="label-3"
      format={{
        style: 'unit',
        unit: 'celsius',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }}
      style={{ width: '18rem' }}
    >
      <Slider.Value className={verticalStyles.Value} />
      <Slider.Control className={verticalStyles.Control}>
        <Slider.Track className={verticalStyles.Track}>
          <Slider.Indicator className={verticalStyles.Indicator} />
          <Slider.Thumb className={verticalStyles.Thumb} />
          <Slider.Thumb className={verticalStyles.Thumb} />
        </Slider.Track>
      </Slider.Control>
      <span className={verticalStyles.Label} id="label-3">
        Temperature Range
      </span>
    </Slider.Root>
  );
}

export default function App() {
  const { settings } = useExperimentSettings<Settings>();
  const direction = settings.rtl ? 'rtl' : 'ltr';
  return (
    <DirectionProvider direction={direction}>
      <div
        dir={direction}
        style={{
          padding: '4rem 8rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '5rem',
          alignItems: 'flex-start',
        }}
      >
        <DelayUntilRepeat />
        <Volume />
        <Brightness />
        <PriceRange />
        <TemperatureRange />
      </div>
    </DirectionProvider>
  );
}
