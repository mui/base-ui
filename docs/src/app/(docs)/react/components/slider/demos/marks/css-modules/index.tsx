import { Slider } from '@base-ui/react/slider';
import styles from './index.module.css';

const MIN = 0;
const MAX = 100;
const MARKS = [0, 25, 50, 75, 100];

export default function MarksSlider() {
  return (
    <Slider.Root className={styles.Root} defaultValue={40} min={MIN} max={MAX}>
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          {MARKS.map((mark) => (
            <div
              key={mark}
              aria-hidden
              className={styles.Mark}
              style={{ left: `${valueToPercent(mark)}%` }}
            />
          ))}
          <Slider.Thumb aria-label="Volume" className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
      <div className={styles.MarkLabels} aria-hidden>
        {MARKS.map((mark) => (
          <span
            key={mark}
            className={styles.MarkLabel}
            style={{ left: `${valueToPercent(mark)}%` }}
          >
            {mark}
          </span>
        ))}
      </div>
    </Slider.Root>
  );
}

function valueToPercent(value: number) {
  return ((value - MIN) / (MAX - MIN)) * 100;
}
