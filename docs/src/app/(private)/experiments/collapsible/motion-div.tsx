'use client';
import * as React from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';
import { motion } from 'motion/react';
import styles from './motion.module.css';
import { ChevronIcon } from './_icons';

export default function CollapsibleMotionDiv() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={styles.wrapper}>
      <Collapsible.Root open={open} onOpenChange={setOpen} className={styles.Root}>
        <Collapsible.Trigger className={styles.Trigger}>
          <ChevronIcon className={styles.Icon} />
          Trigger
        </Collapsible.Trigger>
        <Collapsible.Panel
          className={styles.Panel}
          keepMounted
          render={
            <motion.div
              key="CollapsiblePanel"
              initial={false}
              animate={open ? 'open' : 'closed'}
              exit={!open ? 'open' : 'closed'}
              // https://github.com/framer/motion/issues/368#issuecomment-898055607
              // it's possible to animate padding on Collapsible.Panel with framer-motion
              // it looks much less janky than using CSS animations or transitions, but
              // it's still noticeably un-smooth
              variants={{
                open: {
                  height: 'auto',
                  transition: { duration: 0.6, ease: 'easeOut' },
                },
                closed: {
                  height: 0,
                  // motion needs to ensure the `display` property is set here
                  // to override `display: none` that's usually default on the
                  // [hidden] attribute
                  // however Tailwind v4 sets `display: none !important` and there
                  // is no way for motion to directly override !important
                  // https://github.com/motiondivision/motion/issues/1285#issuecomment-934332108
                  display: 'flex',
                  transition: { duration: 1.2, ease: 'easeIn' },
                },
              }}
            />
          }
        >
          <div className={styles.Content}>
            <p>
              “Certainly; it would indeed be very impertinent and inhuman in me to
              trouble you with any inquisitiveness of mine.”
            </p>
            <p>
              “And yet you rescued me from a strange and perilous situation; you have
              benevolently restored me to life.”
            </p>
            <p>
              Soon after this he inquired if I thought that the breaking up of the
              ice had destroyed the other sledge. I replied that I could not answer
              with any degree of certainty, for the ice had not broken until near
              midnight, and the traveller might have arrived at a place of safety
              before that time; but of this I could not judge.
            </p>
          </div>
        </Collapsible.Panel>
      </Collapsible.Root>
    </div>
  );
}
