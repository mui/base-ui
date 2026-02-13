import { Slider } from '@base-ui/react/slider';
import { Field } from '@base-ui/react/field';
import styles from './index.module.css';

export default function ExampleSlider() {
  return (
    <Field.Root render={<Slider.Root defaultValue={25} className={styles.Root} />}>
      <Field.Label className={styles.Label}>Volume</Field.Label>
      <Slider.Value className={styles.Value} />

      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
    </Field.Root>
  );
}
