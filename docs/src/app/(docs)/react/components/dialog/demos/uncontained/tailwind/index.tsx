import { Dialog } from '@base-ui/react/dialog';

export default function ExampleUncontainedDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="flex h-8 items-center justify-center border border-gray-950 dark:border-white bg-white dark:bg-gray-950 px-3 text-sm font-normal text-gray-950 dark:text-white select-none hover:not-data-disabled:bg-gray-100 dark:hover:not-data-disabled:bg-gray-800 active:not-data-disabled:bg-gray-200 dark:active:not-data-disabled:bg-gray-700 data-disabled:border-gray-500 data-disabled:text-gray-500 disabled:border-gray-500 disabled:text-gray-500 dark:data-disabled:border-gray-400 dark:data-disabled:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800">
        Open dialog
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black/20 dark:bg-black/50 transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 supports-[-webkit-touch-callout:none]:absolute" />
        <Dialog.Viewport className="fixed inset-0 grid place-items-center px-4 py-12 xl:py-6">
          <Dialog.Popup className="group/popup relative flex h-full w-full max-w-[70rem] xl:max-w-none justify-center pointer-events-none transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
            <Dialog.Close
              className="absolute right-0 -top-10 flex h-8 w-8 items-center justify-center border border-gray-950 dark:border-white bg-white dark:bg-gray-950 text-gray-950 dark:text-white shadow-[4px_4px_0] shadow-black/12 dark:shadow-none hover:bg-gray-100 dark:hover:bg-gray-800 xl:top-0 xl:h-10 xl:w-10 pointer-events-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
              aria-label="Close"
            >
              <XIcon className="h-6 w-6" />
            </Dialog.Close>
            <div className="pointer-events-auto box-border h-full w-full max-w-[70rem] bg-white dark:bg-gray-950 p-4 text-gray-950 dark:text-white border border-gray-950 dark:border-white shadow-[4px_4px_0] shadow-black/12 dark:shadow-none transition-[scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[starting-style]/popup:scale-105" />
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
