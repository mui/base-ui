'use client';
import * as React from 'react';
import { Collapsible } from '@base-ui/react/collapsible';
import styles from './animations.module.css';

function ChevronIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M3.5 9L7.5 5L3.5 1" stroke="currentcolor" />
    </svg>
  );
}

export default function CollapsibleActivityKeyframes() {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div>
      <div>
        <button type="button" onClick={() => setIsOpen((open) => !open)}>
          {isOpen ? 'Hide sections' : 'Show sections'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
        <div>
          <h3>Regular mount</h3>
          {isOpen && (
            <Collapsible.Root defaultOpen className={styles.Root}>
              <Collapsible.Trigger className={styles.Trigger}>
                <ChevronIcon className={styles.Icon} />
                Toggle section
              </Collapsible.Trigger>
              <Collapsible.Panel className={styles.Panel} keepMounted>
                <div className={styles.Content}>
                  <p>
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ex quae tempora
                    placeat inventore fugiat esse quo asperiores, quasi, recusandae similique minima
                    molestiae sunt! Quos, optio? Consectetur, delectus inventore!
                  </p>
                </div>
              </Collapsible.Panel>
            </Collapsible.Root>
          )}
        </div>

        <div>
          <h3>Activity mount</h3>
          <React.Activity mode={isOpen ? 'visible' : 'hidden'}>
            <Collapsible.Root defaultOpen className={styles.Root}>
              <Collapsible.Trigger className={styles.Trigger}>
                <ChevronIcon className={styles.Icon} />
                Toggle section
              </Collapsible.Trigger>
              <Collapsible.Panel className={styles.Panel} keepMounted>
                <div className={styles.Content}>
                  <p>
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ex quae tempora
                    placeat inventore fugiat esse quo asperiores, quasi, recusandae similique minima
                    molestiae sunt! Quos, optio? Consectetur, delectus inventore!
                  </p>
                </div>
              </Collapsible.Panel>
            </Collapsible.Root>
          </React.Activity>
        </div>
      </div>
    </div>
  );
}
