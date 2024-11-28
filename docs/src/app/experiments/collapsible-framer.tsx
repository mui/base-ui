'use client';
import * as React from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';
import { motion } from 'framer-motion';
import classes from './collapsible.module.css';

export default function CollapsibleFramer() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={classes.wrapper}>
      <div className={classes.framer}>
        <div className={classes.collapsible}>
          <Collapsible.Root open={open} onOpenChange={setOpen}>
            <Collapsible.Trigger>
              <ExpandMoreIcon />
              Trigger
            </Collapsible.Trigger>
            <Collapsible.Panel
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
                      transition: { duration: 0.6, ease: 'easeIn' },
                      transitionEnd: { display: 'revert-layer' },
                    },
                  }}
                />
              }
            >
              <p>This is the collapsed content</p>
              <p>
                Your Choice of Fried Chicken (Half), Chicken Sandwich, With Shredded
                cabbage & carrot with mustard mayonnaise And Potato Wedges
              </p>
              <p>demo: https://codepen.io/aardrian/pen/QWjBNQG</p>
              <p>https://adrianroselli.com/2020/05/disclosure-widgets.html</p>
            </Collapsible.Panel>
          </Collapsible.Root>
        </div>
      </div>
    </div>
  );
}

function ExpandMoreIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" fill="currentColor" />
    </svg>
  );
}
