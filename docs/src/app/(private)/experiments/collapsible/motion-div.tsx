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
                  display: 'flex',
                  transition: { duration: 1.2, ease: 'easeIn' },
                  // transitionEnd: { display: 'flex' },
                },
              }}
            />
          }
        >
          <div className={styles.Content}>
            <p>This is the collapsed content</p>
            <p>
              Your Choice of Fried Chicken (Half), Chicken Sandwich, With Shredded
              cabbage & carrot with mustard mayonnaise And Potato Wedges
            </p>
            <p>demo: https://codepen.io/aardrian/pen/QWjBNQG</p>
            <p>https://adrianroselli.com/2020/05/disclosure-widgets.html</p>
          </div>
        </Collapsible.Panel>
      </Collapsible.Root>
    </div>
  );
}
