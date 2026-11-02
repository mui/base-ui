'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { AnimatePresence, motion } from 'motion/react';

export default function AnimatedPopoverMotionKeepMountedFalseDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="box-border m-0 inline-flex h-8 items-center justify-center border border-neutral-950 bg-white text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white px-3 py-0 font-[inherit] text-sm leading-5 font-normal select-none hover:bg-neutral-100 active:bg-neutral-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-700 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white outline-0 data-pressed:bg-neutral-100 dark:data-pressed:bg-neutral-800">
        Trigger
      </Popover.Trigger>
      <AnimatePresence>
        {open && (
          <Popover.Portal keepMounted>
            <Popover.Positioner
              className="w-[var(--positioner-width)] h-[var(--positioner-height)] max-w-[var(--available-width)]"
              sideOffset={8}
            >
              <Popover.Popup
                className="box-border px-4 py-3 border border-neutral-950 bg-white text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white text-sm origin-[var(--transform-origin)] shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:shadow-none w-[var(--popup-width,auto)] h-[var(--popup-height,auto)] max-w-[500px] outline-none"
                render={
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  />
                }
              >
                Popup
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </AnimatePresence>
    </Popover.Root>
  );
}
