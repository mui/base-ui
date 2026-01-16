import { Drawer } from '@base-ui/react/drawer';

export default function ExampleDrawer() {
  return (
    <Drawer.Root swipeDirection="down">
      <Drawer.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Open drawer with form fields
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-opacity duration-[450ms] ease-[var(--ease-out-fast)] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:duration-[180ms] data-[ending-style]:ease-[cubic-bezier(0.375,0.015,0.545,0.455)] dark:opacity-70 supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="fixed inset-0 flex items-end justify-center">
          <Drawer.Popup className="-mb-[3rem] w-full max-w-md rounded-t-2xl bg-gray-50 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px)+3rem)] text-gray-900 outline outline-1 outline-gray-200 overflow-y-auto max-h-[calc(100dvh+3rem)] translate-y-[var(--drawer-swipe-movement-y,0px)] transition-transform duration-[525ms] ease-[cubic-bezier(0.45,1.005,0,1.005)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full data-[ending-style]:duration-[180ms] data-[ending-style]:ease-[cubic-bezier(0.375,0.015,0.545,0.455)] dark:outline-gray-300">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gray-300" />
            <Drawer.Title className="mb-1 text-center text-lg font-medium">
              Software keyboard
            </Drawer.Title>
            <Drawer.Description className="mb-4 text-center text-base text-gray-600">
              Tap the input or textarea to open the keyboard and observe viewport changes.
            </Drawer.Description>

            <div className="mb-6 flex flex-col gap-4">
              <label className="flex flex-col items-start gap-1">
                <span className="text-sm font-medium text-gray-900">Name</span>
                <input
                  className="h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
                  inputMode="text"
                  autoComplete="name"
                  placeholder="Enter your name"
                />
              </label>

              <label className="flex flex-col items-start gap-1">
                <span className="text-sm font-medium text-gray-900">Notes</span>
                <textarea
                  className="w-full rounded-md border border-gray-200 px-3.5 py-2 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
                  rows={4}
                  placeholder="Type something…"
                />
              </label>
            </div>

            <div className="flex justify-center">
              <Drawer.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                Close
              </Drawer.Close>
            </div>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
