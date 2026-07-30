'use client';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';

export default function ExampleDialog() {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <React.Fragment>
      <Menu.Root>
        <Menu.Trigger className={buttonClass}>
          Playlist <CaretDownIcon />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="outline-hidden" sideOffset={8} align="start">
            <Menu.Popup className="relative origin-[var(--transform-origin)] border border-neutral-950 bg-white py-1 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 outline-hidden transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none">
              <Menu.Item className={itemClass}>Play</Menu.Item>
              <Menu.Item className={itemClass}>Share</Menu.Item>
              <Menu.Separator className="mx-1 my-1 h-px bg-neutral-950 dark:bg-white" />
              {/* Open the dialog when the menu item is clicked */}
              <Menu.Item className={itemClass} onClick={() => setDialogOpen(true)}>
                Delete…
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      {/* Control the dialog state */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:opacity-50 supports-[-webkit-touch-callout:none]:absolute" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 -mt-8 flex w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 bg-white dark:bg-neutral-950 p-4 text-neutral-950 dark:text-white border border-neutral-950 dark:border-white shadow-[0.25rem_0.25rem_0] shadow-black/12 dark:shadow-none transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-base font-bold">Delete playlist</Dialog.Title>
              <Dialog.Description className="text-sm text-neutral-600 dark:text-neutral-400">
                This will permanently delete the playlist. This action cannot be undone.
              </Dialog.Description>
            </div>
            <div className="flex justify-end gap-3">
              <Dialog.Close className={buttonClass}>Cancel</Dialog.Close>
              <Dialog.Close className={buttonClass}>Delete</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </React.Fragment>
  );
}

const buttonClass =
  'flex h-8 items-center justify-center gap-1.5 border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 data-pressed:bg-neutral-100 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:data-pressed:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

const itemClass =
  "flex cursor-default py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-highlighted:relative data-highlighted:z-0 data-highlighted:text-white data-highlighted:before:absolute data-highlighted:before:inset-x-1 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:bg-neutral-950 data-highlighted:before:content-[''] dark:data-highlighted:text-neutral-950 dark:data-highlighted:before:bg-white";

function CaretDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 6H4l4 4.5z" />
    </svg>
  );
}
