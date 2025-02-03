import * as React from 'react';
import { Avatar } from '@base-ui-components/react/avatar';
import styles from './index.module.css';

export default function ExampleAvatar() {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <Avatar.Root className={styles.Root}>
        <Avatar.Image
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
          width="48"
          height="48"
          className={styles.Image}
        />
        <Avatar.Fallback className={styles.Fallback}>LT</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root className={styles.Root}>LT</Avatar.Root>
    </div>
  );
}
