'use client';
import { Drawer } from '@base-ui/react/drawer';

const fields = [
  ['Name', 'Ada Lovelace'],
  ['Phone', '+1 (555) 123-4567'],
  ['Street address', '12 Computing Way'],
  ['Apartment', 'Unit 4B'],
  ['Delivery window', 'After 6 PM'],
  ['Backup contact', 'Grace Hopper'],
];

export default function ExampleDrawerVirtualKeyboardAware() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-normal text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Open keyboard-aware drawer
      </Drawer.Trigger>
      <Drawer.VirtualKeyboardProvider>
        <Drawer.Portal>
          <Drawer.Backdrop className="[--backdrop-opacity:0.2] dark:[--backdrop-opacity:0.7] fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[swiping]:duration-0 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]" />
          <Drawer.Viewport className="fixed inset-0 flex items-end justify-center touch-none">
            <Drawer.Popup className="relative flex max-h-[min(42rem,calc(100dvh-2rem))] w-full flex-col overflow-hidden rounded-t-2xl bg-white text-gray-900 outline outline-1 outline-gray-200 touch-none shadow-[0_-16px_48px_rgb(0_0_0/0.12),0_6px_18px_rgb(0_0_0/0.06)] [transform:translateY(var(--drawer-swipe-movement-y))] transition-[transform,box-shadow] duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform data-[swiping]:select-none data-[ending-style]:[transform:translateY(calc(100%+2px))] data-[starting-style]:[transform:translateY(calc(100%+2px))] data-[starting-style]:shadow-[0_-16px_48px_rgb(0_0_0/0),0_6px_18px_rgb(0_0_0/0)] data-[ending-style]:shadow-[0_-16px_48px_rgb(0_0_0/0),0_6px_18px_rgb(0_0_0/0)] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]">
              <div className="shrink-0 border-b border-gray-200 px-6 pt-3.5 pb-3 touch-none select-none">
                <div className="mx-auto mb-2.5 h-1 w-12 rounded-full bg-gray-300" />
                <Drawer.Title className="m-0 text-center text-lg font-bold">
                  Delivery details
                </Drawer.Title>
                <Drawer.Description className="mx-auto mt-1 max-w-[28rem] text-center text-[0.9375rem] leading-6 text-gray-600">
                  Edit the address and delivery instructions.
                </Drawer.Description>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-auto px-6 py-4">
                <div className="mx-auto grid w-full max-w-[28rem] gap-3.5">
                  {fields.map(([label, placeholder]) => (
                    <label className="flex flex-col gap-2" key={label}>
                      <span className="text-sm leading-5 font-semibold">{label}</span>
                      <input
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-inherit outline-0 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
                        placeholder={placeholder}
                        type="text"
                      />
                    </label>
                  ))}

                  <label className="flex flex-col gap-2">
                    <span className="text-sm leading-5 font-semibold">Instructions</span>
                    <textarea
                      className="min-h-[5.5rem] w-full resize-y rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-inherit outline-0 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
                      placeholder="Gate code, drop-off spot, or anything else the driver should know"
                    />
                  </label>
                </div>
              </div>

              <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-white px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                <Drawer.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-normal text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                  Close
                </Drawer.Close>
                <button
                  className="flex h-10 items-center justify-center rounded-md border border-gray-900 bg-gray-900 px-3.5 text-base font-normal text-white select-none hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-700"
                  type="button"
                >
                  Save
                </button>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    </Drawer.Root>
  );
}
