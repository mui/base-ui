import * as React from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import styles from './index.module.css';

export default function ExampleCheckbox() {
  return (
    <label className={styles.Label}>
      <Checkbox.Root defaultChecked className={styles.Checkbox}>
        <Checkbox.Indicator className={styles.Indicator}>
          <CheckIcon />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Enable notifications
    </label>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M20 6 9 17l-5-5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
