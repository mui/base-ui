'use client';
import { Collapsible } from '@base-ui/react/collapsible';
import { ChevronIcon } from './_icons';
import styles from './animations.module.css';

export default function CssAnimations() {
  return (
    <div className={styles.grid}>
      <div className={styles.wrapper}>
        <pre>keepMounted: true</pre>
        <Collapsible.Root className={styles.Root} defaultOpen>
          <Collapsible.Trigger className={styles.Trigger}>
            <ChevronIcon className={styles.Icon} />
            Trigger
          </Collapsible.Trigger>
          <Collapsible.Panel className={styles.Panel} keepMounted>
            <div className={styles.Content}>
              <p>
                He rubbed his eyes, and came close to the picture, and examined it again. There were
                no signs of any change when he looked into the actual painting, and yet there was no
                doubt that the whole expression had altered. It was not a mere fancy of his own. The
                thing was horribly apparent.
              </p>
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>

        <Collapsible.Root className={styles.Root} defaultOpen={false}>
          <Collapsible.Trigger className={styles.Trigger}>
            <ChevronIcon className={styles.Icon} />
            Trigger
          </Collapsible.Trigger>
          <Collapsible.Panel className={styles.Panel} keepMounted>
            <div className={styles.Content}>
              <p>
                He rubbed his eyes, and came close to the picture, and examined it again. There were
                no signs of any change when he looked into the actual painting, and yet there was no
                doubt that the whole expression had altered. It was not a mere fancy of his own. The
                thing was horribly apparent.
              </p>
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
        <small>———</small>
      </div>

      <div className={styles.wrapper}>
        <pre>keepMounted: false</pre>
        <Collapsible.Root className={styles.Root} defaultOpen>
          <Collapsible.Trigger className={styles.Trigger}>
            <ChevronIcon className={styles.Icon} />
            Trigger
          </Collapsible.Trigger>
          <Collapsible.Panel className={styles.Panel} keepMounted={false}>
            <div className={styles.Content}>
              <p>
                He rubbed his eyes, and came close to the picture, and examined it again. There were
                no signs of any change when he looked into the actual painting, and yet there was no
                doubt that the whole expression had altered. It was not a mere fancy of his own. The
                thing was horribly apparent.
              </p>
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>

        <Collapsible.Root className={styles.Root} defaultOpen={false}>
          <Collapsible.Trigger className={styles.Trigger}>
            <ChevronIcon className={styles.Icon} />
            Trigger
          </Collapsible.Trigger>
          <Collapsible.Panel className={styles.Panel} keepMounted={false}>
            <div className={styles.Content}>
              <p>
                He rubbed his eyes, and came close to the picture, and examined it again. There were
                no signs of any change when he looked into the actual painting, and yet there was no
                doubt that the whole expression had altered. It was not a mere fancy of his own. The
                thing was horribly apparent.
              </p>
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
        <small>———</small>
      </div>
    </div>
  );
}
