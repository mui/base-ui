import { Input } from '@base-ui/react/input';
import styles from './index.module.css';

export default function ExampleInput() {
  return (
    <label className={styles.Label}>
      Name
      <Input placeholder="Enter your name" className={styles.Input} />
    </label>
  );
}
