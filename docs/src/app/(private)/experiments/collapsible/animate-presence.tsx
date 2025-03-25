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
                <p>This is the collapsed content</p>
                <p>
                  Your Choice of Fried Chicken (Half), Chicken Sandwich, With
                  Shredded cabbage & carrot with mustard mayonnaise And Potato Wedges
                </p>
                <p>demo: https://codepen.io/aardrian/pen/QWjBNQG</p>
                <p>https://adrianroselli.com/2020/05/disclosure-widgets.html</p>
              </div>
            </Collapsible.Panel>
          )}
        </AnimatePresence>
      </Collapsible.Root>
    </div>
  );
}
