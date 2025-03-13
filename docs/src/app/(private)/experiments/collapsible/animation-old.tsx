'use client';
import * as React from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';
import styles from './animation.module.css';

export default function CollapsibleCssAnimation() {
  return (
    <div className={styles.wrapper}>
      <Collapsible.Root defaultOpen className={styles.Root}>
        <Collapsible.Trigger className={styles.Trigger}>Trigger</Collapsible.Trigger>
        <Collapsible.Panel className={styles.Panel} keepMounted>
          <div className={styles.Content}>
            <p>
              He rubbed his eyes, and came close to the picture, and examined it
              again. There were no signs of any change when he looked into the actual
              painting, and yet there was no doubt that the whole expression had
              altered. It was not a mere fancy of his own. The thing was horribly
              apparent.
            </p>
          </div>
        </Collapsible.Panel>
      </Collapsible.Root>

      <Collapsible.Root defaultOpen={false} className={styles.Root}>
        <Collapsible.Trigger className={styles.Trigger}>Trigger</Collapsible.Trigger>
        <Collapsible.Panel className={styles.Panel} keepMounted>
          <div className={styles.Content}>
            <p>
              He rubbed his eyes, and came close to the picture, and examined it
              again. There were no signs of any change when he looked into the actual
              painting, and yet there was no doubt that the whole expression had
              altered. It was not a mere fancy of his own. The thing was horribly
              apparent.
            </p>
          </div>
        </Collapsible.Panel>
      </Collapsible.Root>
    </div>
  );
}
