import * as React from 'react';
import { Progress } from '@base-ui-components/react/progress';
import styles from './index.module.css';

export default function ExampleProgress() {
  const [value, setValue] = React.useState(20);

  // Simulate changes
  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setValue((current) => Math.min(100, Math.round(current + Math.random() * 25)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Progress.Root value={value}>
      <Progress.Track className={styles.Track}>
        <Progress.Indicator className={styles.Indicator} />
      </Progress.Track>
    </Progress.Root>
  );
}
