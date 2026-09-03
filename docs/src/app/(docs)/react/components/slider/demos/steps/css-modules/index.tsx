import { Slider } from '@base-ui/react/slider';
import styles from './index.module.css';

export default function StepsSlider() {
  return (
    <Slider.Root
      className={styles.Root}
      defaultValue={400}
      min={100}
      max={900}
      step={100}
      largeStep={200}
    >
      <Slider.Label className={styles.Label}>Font weight</Slider.Label>
      <Slider.Value className={styles.Value} />
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb aria-label="Font weight" className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
