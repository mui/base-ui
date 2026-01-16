import { Drawer } from '@base-ui/react/drawer';

export default function ExampleDrawer() {
  return (
    <Drawer.Root swipeDirection="down">
      <Drawer.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Open bottom drawer
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-opacity duration-[450ms] ease-[var(--ease-out-fast)] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:duration-[180ms] data-[ending-style]:ease-[cubic-bezier(0.375,0.015,0.545,0.455)] dark:opacity-70 supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Viewport className="fixed inset-0 flex items-end justify-center">
          <Drawer.Popup className="-mb-[3rem] translate-y-[var(--drawer-swipe-movement-y,0px)] w-full max-w-md max-h-[calc(80vh+3rem)] rounded-t-2xl bg-gray-50 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px)+3rem)] pt-4 text-gray-900 outline outline-1 outline-gray-200 overflow-y-auto transition-transform duration-[525ms] ease-[cubic-bezier(0.45,1.005,0,1.005)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full data-[ending-style]:duration-[180ms] data-[ending-style]:ease-[cubic-bezier(0.375,0.015,0.545,0.455)] dark:outline-gray-300">
            <div className="w-12 h-1 mx-auto mb-4 rounded-full bg-gray-300" />
            <Drawer.Title className="mb-1 text-lg font-medium text-center">
              Notifications
            </Drawer.Title>
            <Drawer.Description className="mb-6 text-base text-gray-600 text-center">
              You are all caught up. Good job!
            </Drawer.Description>
            <div className="flex justify-center gap-4">
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
