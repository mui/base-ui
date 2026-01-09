import { Drawer } from '@base-ui/react/drawer';

export default function ExampleDrawer() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Open drawer
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-opacity duration-[450ms] ease-[var(--ease-out-fast)] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:duration-[180ms] data-[ending-style]:ease-[cubic-bezier(0.375,0.015,0.545,0.455)] dark:opacity-70 supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Popup className="fixed top-0 right-[-3rem] bottom-0 w-[calc(20rem+3rem)] max-w-[calc(100vw-3rem+3rem)] bg-gray-50 p-6 pr-[calc(1.5rem+3rem)] text-gray-900 outline outline-1 outline-gray-200 overflow-y-auto translate-x-[var(--drawer-swipe-movement-x,0px)] transition-transform duration-[525ms] ease-[cubic-bezier(0.45,1.005,0,1.005)] data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full data-[ending-style]:duration-[180ms] data-[ending-style]:ease-[cubic-bezier(0.375,0.015,0.545,0.455)] dark:outline-gray-300">
          <Drawer.Title className="-mt-1.5 mb-1 text-lg font-medium">Drawer</Drawer.Title>
          <Drawer.Description className="mb-6 text-base text-gray-600">
            This is a drawer that slides in from the side. You can swipe to dismiss it.
          </Drawer.Description>
          <div className="flex justify-end gap-4">
            <Drawer.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
              Close
            </Drawer.Close>
          </div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
