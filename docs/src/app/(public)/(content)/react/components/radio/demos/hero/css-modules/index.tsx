import { Radio } from '@base-ui-components/react/radio';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import styles from './index.module.css';

export default function ExampleRadioGroup() {
  return (
    <RadioGroup
      aria-labelledby="apples-caption"
      defaultValue="fuji-apple"
      className={styles.RadioGroup}
    >
      <div className={styles.Caption} id="apples-caption">
        Best apple
      </div>

      <div className={styles.Item}>
        <Radio.Root id="fuji-apple" value="fuji-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        <label htmlFor="fuji-apple">Fuji</label>
      </div>

      <div className={styles.Item}>
        <Radio.Root id="gala-apple" value="gala-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        <label htmlFor="gala-apple">Gala</label>
      </div>

      <div className={styles.Item}>
        <Radio.Root id="granny-smith-apple" value="granny-smith-apple" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        <label htmlFor="granny-smith-apple">Granny Smith</label>
      </div>
    </RadioGroup>
  );
}
