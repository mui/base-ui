import * as React from 'react';
import { AspectRatio } from '@base-ui-components/react/aspect-ratio';
import styles from './index.module.css';

export default function ExampleAspectRatio() {
  return (
    <div className={styles.wrapper}>
      <AspectRatio ratio={5 / 8}>
        <img
          src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&amp;h=128&amp;dpr=2&amp;q=80"
          alt="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&amp;h=128&amp;dpr=2&amp;q=80"
        />
      </AspectRatio>
    </div>
  );
}
