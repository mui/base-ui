'use client';
import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { AnimatePresence, motion } from 'motion/react';

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
      <Select.Trigger className="box-border m-0 flex h-8 min-w-36 items-center justify-between gap-3 py-px pl-2 pr-1 outline-0 border border-neutral-950 bg-white text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white font-[inherit] text-sm font-normal select-none hover:bg-neutral-100 active:bg-neutral-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-700 data-pressed:bg-neutral-100 dark:data-pressed:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white">
        <Select.Value className="data-placeholder:text-neutral-500 dark:data-placeholder:text-neutral-400" />
        <Select.Icon>
          <CaretUpDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <AnimatePresence>
        {portalMounted && (
          <Select.Portal>
            <Select.Positioner
              className="z-10 outline-none select-none"
              sideOffset={4}
              ref={positionerRef}
            >
              <Select.Popup
                className="box-border outline-0 border border-neutral-950 bg-white text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white bg-clip-padding min-w-[var(--anchor-width)] origin-[var(--transform-origin)] shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:shadow-none data-[side=none]:min-w-[calc(var(--anchor-width)+1.75rem)]"
                render={motionElement}
              >
                <Select.ScrollUpArrow className="w-full bg-white z-1 text-center cursor-default h-4 text-xs flex items-center justify-center dark:bg-neutral-950 before:content-[''] before:absolute before:w-full before:h-full before:left-0 data-[direction=up]:top-0 data-[direction=up]:data-[side=none]:before:-top-full data-[direction=down]:bottom-0 data-[direction=down]:data-[side=none]:before:-bottom-full" />
                <Select.List className="box-border relative py-1 overflow-y-auto max-h-[var(--available-height)] scroll-py-6">
                  {fonts.map(({ label, value }) => (
                    <Select.Item
                      key={label}
                      value={value}
                      className="box-border outline-0 text-sm py-1.5 pl-2.5 pr-4 grid gap-2 items-center grid-cols-[1rem_1fr] cursor-default select-none data-highlighted:bg-neutral-950 data-highlighted:text-white dark:data-highlighted:bg-white dark:data-highlighted:text-neutral-950"
                    >
                      <Select.ItemIndicator className="col-start-1">
                        <CheckIcon />
                      </Select.ItemIndicator>
                      <Select.ItemText className="col-start-2">{label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
                <Select.ScrollDownArrow className="w-full bg-white z-1 text-center cursor-default h-4 text-xs flex items-center justify-center dark:bg-neutral-950 before:content-[''] before:absolute before:w-full before:h-full before:left-0 data-[direction=up]:top-0 data-[direction=up]:data-[side=none]:before:-top-full data-[direction=down]:bottom-0 data-[direction=down]:data-[side=none]:before:-bottom-full" />
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        )}
      </AnimatePresence>
    </Select.Root>
  );
}

function CaretUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}
