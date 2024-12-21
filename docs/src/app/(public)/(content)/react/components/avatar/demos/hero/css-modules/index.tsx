import * as React from 'react';
import { Avatar } from '@base-ui-components/react/avatar';
import styles from './index.module.css';

export default function ExampleAvatar() {
  return (
    <Avatar.Root className={styles.Root}>
      <Avatar.Image src="https://images.unsplash.com/photo-1511485977113-f34c92461ad9?w=128&h=128&dpr=2&q=80" className={styles.Image} />
      <Avatar.Fallback className={styles.Fallback}>
        LT
      </Avatar.Fallback>
    </Avatar.Root>
  );
}
