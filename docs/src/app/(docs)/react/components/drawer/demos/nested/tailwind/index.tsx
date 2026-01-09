'use client';
import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';

export default function ExampleDrawerNested() {
  const [firstOpen, setFirstOpen] = React.useState(false);
  const [secondOpen, setSecondOpen] = React.useState(false);
  const [thirdOpen, setThirdOpen] = React.useState(false);

  const popupClassName =
    'fixed bottom-[-3rem] left-1/2 w-full max-w-md max-h-[calc(80vh+3rem)] [height:var(--drawer-height,auto)] -translate-x-1/2 rounded-t-2xl bg-gray-50 px-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px)+3rem)] text-gray-900 outline outline-1 outline-gray-200 overflow-y-auto shadow-[0_2px_10px_rgb(0_0_0/0.1)] [--bleed:3rem] [--peek:1rem] [--scale:calc(max(0,1-(var(--drawer-nested-dialogs)*0.05)))] [--shrink:calc(1-var(--scale))] [--height:max(0px,calc(var(--drawer-frontmost-height,var(--drawer-height,0px))-var(--bleed)))] [transform-origin:50%_calc(100%-var(--bleed))] [transform:translateX(-50%)_translateY(calc(var(--drawer-swipe-movement-y,0px)-(var(--drawer-nested-dialogs)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] data-[ending-style]:[transform:translateX(-50%)_translateY(calc(100%+var(--drawer-swipe-movement-y,0px)))_scale(var(--scale))] data-[starting-style]:[transform:translateX(-50%)_translateY(calc(100%+var(--drawer-swipe-movement-y,0px)))_scale(var(--scale))] data-[ending-style]:duration-[180ms] data-[ending-style]:ease-[cubic-bezier(0.375,0.015,0.545,0.455)] data-[nested-drawer-open]:h-[calc(var(--height)+var(--bleed))] data-[nested-drawer-open]:overflow-hidden data-[nested-drawer-open]:after:absolute data-[nested-drawer-open]:after:inset-0 data-[nested-drawer-open]:after:rounded-[inherit] data-[nested-drawer-open]:after:bg-black/5 dark:outline-gray-300 [transition:transform_525ms_cubic-bezier(0.45,1.005,0,1.005),height_0.15s]';

  return (
    <Drawer.Root
      open={firstOpen}
      onOpenChange={(nextOpen) => {
        setFirstOpen(nextOpen);
        if (!nextOpen) {
          setSecondOpen(false);
          setThirdOpen(false);
        }
      }}
      swipeDirection="down"
    >
      <Drawer.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Open drawer stack
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-opacity duration-450 ease-out-fast data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-180 data-ending-style:ease-in-slow dark:opacity-70 supports-[-webkit-touch-callout:none]:absolute" />
        <Drawer.Popup className={popupClassName}>
          <div className="w-12 h-1 mx-auto mb-4 rounded-full bg-gray-300" />
          <Drawer.Title className="mb-1 text-lg font-medium text-center">Account</Drawer.Title>
          <Drawer.Description className="mb-6 text-base text-gray-600 text-center">
            Nested drawers can be styled to stack, while each drawer remains independently focus
            managed.
          </Drawer.Description>

          <div className="flex items-center justify-end gap-4">
            <div className="mr-auto">
              <Drawer.Root
                open={secondOpen}
                onOpenChange={(nextOpen) => {
                  setSecondOpen(nextOpen);
                  if (!nextOpen) {
                    setThirdOpen(false);
                  }
                }}
                swipeDirection="down"
              >
                <Drawer.Trigger className="text-base font-medium text-blue-800 rounded px-1.5 py-0.5 -m-0.5 hover:bg-blue-800/5 active:bg-blue-800/10 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800">
                  Security settings
                </Drawer.Trigger>
                <Drawer.Portal>
                  <Drawer.Popup className={popupClassName}>
                    <div className="w-12 h-1 mx-auto mb-4 rounded-full bg-gray-300" />
                    <Drawer.Title className="mb-1 text-lg font-medium text-center">
                      Security
                    </Drawer.Title>
                    <Drawer.Description className="mb-6 text-base text-gray-600 text-center">
                      Review sign-in activity and update your security preferences.
                    </Drawer.Description>

                    <ul className="mb-6 list-disc pl-5 text-gray-700">
                      <li>Passkeys enabled</li>
                      <li>2FA via authenticator app</li>
                      <li>3 signed-in devices</li>
                    </ul>

                    <div className="flex items-center justify-end gap-4">
                      <div className="mr-auto">
                        <Drawer.Root
                          open={thirdOpen}
                          onOpenChange={setThirdOpen}
                          swipeDirection="down"
                        >
                          <Drawer.Trigger className="text-base font-medium text-blue-800 rounded px-1.5 py-0.5 -m-0.5 hover:bg-blue-800/5 active:bg-blue-800/10 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800">
                            Advanced options
                          </Drawer.Trigger>
                          <Drawer.Portal>
                            <Drawer.Popup className={popupClassName}>
                              <div className="w-12 h-1 mx-auto mb-4 rounded-full bg-gray-300" />
                              <Drawer.Title className="mb-1 text-lg font-medium text-center">
                                Advanced
                              </Drawer.Title>
                              <Drawer.Description className="mb-6 text-base text-gray-600 text-center">
                                This drawer is taller to demonstrate variable-height stacking.
                              </Drawer.Description>

                              <div className="grid gap-1.5 mb-4">
                                <label
                                  className="text-sm font-medium text-gray-700"
                                  htmlFor="device-name-tw"
                                >
                                  Device name
                                </label>
                                <input
                                  id="device-name-tw"
                                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-2 text-gray-900 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800"
                                  defaultValue="Personal laptop"
                                />
                              </div>

                              <div className="grid gap-1.5 mb-6">
                                <label
                                  className="text-sm font-medium text-gray-700"
                                  htmlFor="notes-tw"
                                >
                                  Notes
                                </label>
                                <textarea
                                  id="notes-tw"
                                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-2 text-gray-900 resize-y focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800"
                                  defaultValue="Rotate recovery codes and revoke older sessions."
                                  rows={3}
                                />
                              </div>

                              <div className="flex justify-end">
                                <Drawer.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                                  Done
                                </Drawer.Close>
                              </div>
                            </Drawer.Popup>
                          </Drawer.Portal>
                        </Drawer.Root>
                      </div>

                      <Drawer.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                        Close
                      </Drawer.Close>
                    </div>
                  </Drawer.Popup>
                </Drawer.Portal>
              </Drawer.Root>
            </div>

            <Drawer.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
              Close
            </Drawer.Close>
          </div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
