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
              // when using motion we can't defer the hidden attribute
              // this ensures the panel is visible during the exit animation
              // Tailwind v4 sets `display: none !important` on [hidden] and there
              // is no way for motion to directly override !important
              // https://github.com/motiondivision/motion/issues/1285#issuecomment-934332108
              hidden={undefined}
              keepMounted
              render={
                <motion.div
                  // https://github.com/framer/motion/issues/368#issuecomment-898055607
                  // it's possible to animate padding on Collapsible.Panel with framer-motion
                  // it looks much less janky than using CSS animations or transitions, but
                  // it's still noticeably un-smooth
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: '100%',
                    opacity: 1,
                    transition: { duration: 1 },
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    // motion needs to ensure the `display` property is set here
                    // to override `display: none` that's usually default on the
                    // [hidden] attribute
                    // display: 'block',
                    transition: { duration: 1 },
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
