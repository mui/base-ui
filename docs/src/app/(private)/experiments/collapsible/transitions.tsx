'use client';
import * as React from 'react';
import { Collapsible } from '@base-ui/react/collapsible';
import { ChevronIcon } from './_icons';
import styles from './transitions.module.css';

export default function CssTransitions() {
  const [open, setOpen] = React.useState(false);
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

      <div className={styles.wrapper}>
        <pre>controlled</pre>
        <Collapsible.Root className={styles.Root} open={open} onOpenChange={setOpen}>
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

        <pre>nested</pre>
        <Collapsible.Root className={styles.Root}>
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
              <Collapsible.Root className={styles.Root}>
                <Collapsible.Trigger className={styles.Trigger}>
                  <ChevronIcon className={styles.Icon} />
                  Trigger
                </Collapsible.Trigger>
                <Collapsible.Panel className={styles.Panel} keepMounted>
                  <div className={styles.Content}>
                    <p>
                      He rubbed his eyes, and came close to the picture, and examined it again.
                      There were no signs of any change when he looked into the actual painting, and
                      yet there was no doubt that the whole expression had altered. It was not a
                      mere fancy of his own. The thing was horribly apparent.
                    </p>
                  </div>
                </Collapsible.Panel>
              </Collapsible.Root>
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
        <small>———</small>

        <div style={{ height: 1000 }} />
      </div>
    </div>
  );
}
