import * as React from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import styles from './index.module.css';

export default function ExampleCheckbox() {
  return (
    <label className={styles.Label}>
      <Checkbox.Root defaultChecked className={styles.Checkbox}>
        <Checkbox.Indicator className={styles.Indicator}>
          <CheckIcon className={styles.Icon} />
        </Checkbox.Indicator>
      </Checkbox.Root>
      Enable notifications
    </label>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
