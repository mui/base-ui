'use client';
import * as React from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';
import { motion, AnimatePresence } from 'motion/react';
import styles from './motion.module.css';
import { ChevronIcon } from './_icons';

export default function CollapsibleAnimatePresence() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={styles.wrapper}>
      <Collapsible.Root open={open} onOpenChange={setOpen} className={styles.Root}>
        <Collapsible.Trigger className={styles.Trigger}>
          <ChevronIcon className={styles.Icon} />
          Trigger
        </Collapsible.Trigger>
        <AnimatePresence>
          {open && (
            <Collapsible.Panel
              key="hey"
              className={styles.Panel}
              keepMounted
              render={
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: '100%',
                    opacity: 1,
                    transition: { duration: 2 },
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    display: 'block',
                    transition: { duration: 20 },
                  }}
                />
              }
            >
              <div className={styles.Content}>
                <p>
                  “Certainly; it would indeed be very impertinent and inhuman in me
                  to trouble you with any inquisitiveness of mine.”
                </p>
                <p>
                  “And yet you rescued me from a strange and perilous situation; you
                  have benevolently restored me to life.”
                </p>
                <p>
                  Soon after this he inquired if I thought that the breaking up of
                  the ice had destroyed the other sledge. I replied that I could not
                  answer with any degree of certainty, for the ice had not broken
                  until near midnight, and the traveller might have arrived at a
                  place of safety before that time; but of this I could not judge.
                </p>
              </div>
            </Collapsible.Panel>
          )}
        </AnimatePresence>
      </Collapsible.Root>
    </div>
  );
}
