import { Dialog } from '@base-ui/react/dialog';

export default function ExampleUncontainedDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Open dialog
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-70 backdrop-blur-[2px] transition-[opacity,backdrop-filter] duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 supports-[-webkit-touch-callout:none]:absolute dark:opacity-70" />
        <Dialog.Viewport className="fixed inset-0 grid place-items-center px-4 py-10 xl:py-6">
          <Dialog.Popup className="group/popup flex h-full w-full justify-center pointer-events-none transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
            <Dialog.Close
              className="absolute right-3 top-2 flex h-7 w-7 items-center justify-center rounded-md border-0 bg-transparent text-gray-50 hover:bg-white/10 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-gray-50 xl:right-3 xl:top-3 xl:h-10 xl:w-10 dark:text-gray-900 dark:focus-visible:outline-gray-900 pointer-events-auto"
              aria-label="Close"
            >
              <XIcon className="h-8 w-8" />
            </Dialog.Close>
            <div className="pointer-events-auto box-border h-full w-full max-w-[70rem] rounded-lg bg-gray-50 p-6 text-gray-900 outline-1 outline-gray-200 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[starting-style]/popup:scale-110 dark:outline-gray-300" />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
