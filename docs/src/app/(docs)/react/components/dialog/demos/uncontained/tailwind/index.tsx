import { Dialog } from '@base-ui/react/dialog';

export default function ExampleUncontainedDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="flex h-8 items-center justify-center bg-gray-200 dark:bg-gray-800 px-3 text-sm font-normal text-gray-950 dark:text-white select-none hover:bg-gray-300 dark:hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800">
        Open dialog
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-70 backdrop-blur-[2px] transition-[opacity,backdrop-filter] duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 supports-[-webkit-touch-callout:none]:absolute dark:opacity-70" />
        <Dialog.Viewport className="fixed inset-0 grid place-items-center px-4 py-10 xl:py-6">
          <Dialog.Popup className="group/popup flex h-full w-full justify-center pointer-events-none transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
            <Dialog.Close
              className="absolute right-3 top-2 flex h-7 w-7 items-center justify-center bg-transparent text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white xl:right-3 xl:top-3 xl:h-10 xl:w-10 pointer-events-auto"
              aria-label="Close"
            >
              <XIcon className="h-6 w-6" />
            </Dialog.Close>
            <div className="pointer-events-auto box-border h-full w-full max-w-[70rem] bg-white dark:bg-gray-950 p-4 text-gray-950 dark:text-white border border-gray-950 dark:border-white shadow-[4px_4px_0] shadow-black/12 dark:shadow-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[starting-style]/popup:scale-105" />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
