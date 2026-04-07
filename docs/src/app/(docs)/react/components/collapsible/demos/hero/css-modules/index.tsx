import * as React from 'react';
import { Collapsible } from '@base-ui/react/collapsible';
import styles from './index.module.css';

export default function ExampleCollapsible() {
  return (
    <Collapsible.Root className={styles.Collapsible}>
      <Collapsible.Trigger className={styles.Trigger}>
        <ChevronIcon className={styles.Icon} />
        Recovery keys
      </Collapsible.Trigger>
      <Collapsible.Panel className={styles.Panel}>
        <div className={styles.Content}>
          <div>alien-bean-pasta</div>
          <div>wild-irish-burrito</div>
          <div>horse-battery-staple</div>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

export function ChevronIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M3.5 9L7.5 5L3.5 1" stroke="currentcolor" />
    </svg>
  );
}
