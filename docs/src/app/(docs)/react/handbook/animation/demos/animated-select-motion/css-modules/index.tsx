'use client';
import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { AnimatePresence, motion } from 'motion/react';
import styles from './index.module.css';

const fonts = [
  { label: 'Select font', value: null },
  { label: 'Sans-serif', value: 'sans' },
  { label: 'Serif', value: 'serif' },
  { label: 'Monospace', value: 'mono' },
  { label: 'Cursive', value: 'cursive' },
];

export default function AnimatedSelectMotionDemo() {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const positionerRef = React.useCallback(() => {
    setMounted(true);
  }, []);

  const portalMounted = open || mounted;

  // Once the trigger has been interacted with, the popup will always be
  // mounted in the DOM. We can use this to determine which animation variant
  // to use: if it's already mounted, we switch to use "keepMounted" animations.
  const motionElement = mounted ? (
    <motion.div
      initial={false}
      animate={{
        opacity: open ? 1 : 0,
        scale: open ? 1 : 0.8,
      }}
    />
  ) : (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    />
  );

  return (
    <Select.Root items={fonts} open={open} onOpenChange={setOpen}>
      <Select.Trigger className={styles.Select}>
        <Select.Value />
        <Select.Icon className={styles.SelectIcon}>
          <ChevronUpDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <AnimatePresence>
        {portalMounted && (
          <Select.Portal>
            <Select.Positioner className={styles.Positioner} sideOffset={8} ref={positionerRef}>
              <Select.Popup className={styles.Popup} render={motionElement}>
                <Select.ScrollUpArrow className={styles.ScrollArrow} />
                <Select.List className={styles.List}>
                  {fonts.map(({ label, value }) => (
                    <Select.Item key={label} value={value} className={styles.Item}>
                      <Select.ItemIndicator className={styles.ItemIndicator}>
                        <CheckIcon className={styles.ItemIndicatorIcon} />
                      </Select.ItemIndicator>
                      <Select.ItemText className={styles.ItemText}>{label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
                <Select.ScrollDownArrow className={styles.ScrollArrow} />
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        )}
      </AnimatePresence>
    </Select.Root>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
