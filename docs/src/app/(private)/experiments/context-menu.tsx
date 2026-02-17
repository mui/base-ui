'use client';
import * as React from 'react';
import { ContextMenu } from '@base-ui/react/context-menu';
import { Menu } from '@base-ui/react/menu';
import { Popover } from '@base-ui/react/popover';

export default function ContextMenuExperiment() {
  const [disabled, setDisabled] = React.useState(false);

  return (
    <div className="space-y-12 p-8">
      <h1 className="text-2xl font-bold">Context Menu Experiments</h1>

      {/* Scenario 1: Context menu within a context menu trigger */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Context Menu within Context Menu Trigger</h2>
        <p className="text-gray-600">
          Right-click on the outer box, then right-click on the inner box to see nested context
          menus.
        </p>

        <ContextMenu.Root>
          <ContextMenu.Trigger className="border-blue-300 bg-blue-50 rounded-lg border-2 p-8">
            <div className="text-center">
              <span className="text-blue-700 block font-medium">Outer Context Menu</span>
              <span className="text-blue-600 block text-sm">Right-click me</span>

              <ContextMenu.Root>
                <ContextMenu.Trigger className="border-red-300 bg-red-50 mt-4 inline-block rounded border-2 p-4">
                  <span className="text-red-700 block font-medium">Inner Context Menu</span>
                  <span className="text-red-600 block text-sm">Right-click me too!</span>
                </ContextMenu.Trigger>
                <ContextMenu.Portal>
                  <ContextMenu.Positioner className="outline-none">
                    <ContextMenu.Popup className="min-w-[180px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                      <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                        Inner Action 1
                      </ContextMenu.Item>
                      <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                        Inner Action 2
                      </ContextMenu.Item>
                      <ContextMenu.Separator className="my-1 h-px bg-gray-200" />
                      <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                        Inner Delete
                      </ContextMenu.Item>
                    </ContextMenu.Popup>
                  </ContextMenu.Positioner>
                </ContextMenu.Portal>
              </ContextMenu.Root>
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner className="outline-none">
              <ContextMenu.Popup className="min-w-[180px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                  Outer Action 1
                </ContextMenu.Item>
                <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                  Outer Action 2
                </ContextMenu.Item>
                <ContextMenu.Separator className="my-1 h-px bg-gray-200" />
                <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                  Outer Delete
                </ContextMenu.Item>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      </section>

      {/* Scenario 2: Context menu within context menu trigger, both with submenus */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">2. Nested Context Menus with Submenus</h2>
        <p className="text-gray-600">Right-click on either box and explore the submenu options.</p>

        <ContextMenu.Root>
          <ContextMenu.Trigger className="border-green-300 bg-green-50 rounded-lg border-2 p-8">
            <div className="text-center">
              <span className="text-green-700 block font-medium">
                Outer Context Menu with Submenu
              </span>
              <span className="text-green-600 block text-sm">Right-click me</span>

              <ContextMenu.Root>
                <ContextMenu.Trigger className="border-purple-300 bg-purple-50 mt-4 inline-block rounded border-2 p-4">
                  <span className="text-purple-700 block font-medium">
                    Inner Context Menu with Submenu
                  </span>
                  <span className="text-purple-600 block text-sm">Right-click me too!</span>
                </ContextMenu.Trigger>
                <ContextMenu.Portal>
                  <ContextMenu.Positioner className="outline-none">
                    <ContextMenu.Popup className="min-w-[180px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                      <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                        Inner Basic Action
                      </ContextMenu.Item>

                      <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger className="flex cursor-default items-center justify-between px-3 py-2 text-sm hover:bg-gray-100">
                          Inner Submenu
                          <ChevronRightIcon />
                        </Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner className="outline-none" sideOffset={4}>
                            <Menu.Popup className="min-w-[160px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                              <Menu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                                Inner Sub Action 1
                              </Menu.Item>
                              <Menu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                                Inner Sub Action 2
                              </Menu.Item>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.SubmenuRoot>

                      <ContextMenu.Separator className="my-1 h-px bg-gray-200" />
                      <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                        Inner Delete
                      </ContextMenu.Item>
                    </ContextMenu.Popup>
                  </ContextMenu.Positioner>
                </ContextMenu.Portal>
              </ContextMenu.Root>
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner className="outline-none">
              <ContextMenu.Popup className="min-w-[180px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                  Outer Basic Action
                </ContextMenu.Item>

                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger className="flex cursor-default items-center justify-between px-3 py-2 text-sm hover:bg-gray-100">
                    Outer Submenu
                    <ChevronRightIcon />
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner className="outline-none" sideOffset={4}>
                      <Menu.Popup className="min-w-[160px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                        <Menu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                          Outer Sub Action 1
                        </Menu.Item>
                        <Menu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                          Outer Sub Action 2
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>

                <ContextMenu.Separator className="my-1 h-px bg-gray-200" />
                <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                  Outer Delete
                </ContextMenu.Item>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      </section>

      {/* Scenario 3: Context menu within context menu popup item, both with submenus */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">3. Context Menu within Context Menu Popup Item</h2>
        <p className="text-gray-600">
          Right-click on the box, then right-click on the "Special Item" in the popup.
        </p>

        <ContextMenu.Root>
          <ContextMenu.Trigger className="border-orange-300 bg-orange-50 rounded-lg border-2 p-8">
            <div className="text-center">
              <span className="text-orange-700 block font-medium">Complex Context Menu</span>
              <span className="text-orange-600 block text-sm">
                Right-click me, then right-click "Special Item"
              </span>
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner className="outline-none">
              <ContextMenu.Popup className="min-w-[180px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                  Regular Action
                </ContextMenu.Item>

                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger className="flex cursor-default items-center justify-between px-3 py-2 text-sm hover:bg-gray-100">
                    Main Submenu
                    <ChevronRightIcon />
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner className="outline-none" sideOffset={4}>
                      <Menu.Popup className="min-w-[160px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                        <Menu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                          Sub Action 1
                        </Menu.Item>
                        <Menu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                          Sub Action 2
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>

                <ContextMenu.Separator className="my-1 h-px bg-gray-200" />

                {/* Context menu within popup item */}
                <ContextMenu.Root>
                  <ContextMenu.Trigger className="block w-full cursor-default px-3 py-2 text-left text-sm hover:bg-gray-100">
                    Special Item (right-click me!)
                  </ContextMenu.Trigger>
                  <ContextMenu.Portal>
                    <ContextMenu.Positioner className="outline-none">
                      <ContextMenu.Popup className="min-w-[180px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                        <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                          Nested Action 1
                        </ContextMenu.Item>

                        <Menu.SubmenuRoot>
                          <Menu.SubmenuTrigger className="flex cursor-default items-center justify-between px-3 py-2 text-sm hover:bg-gray-100">
                            Nested Submenu
                            <ChevronRightIcon />
                          </Menu.SubmenuTrigger>
                          <Menu.Portal>
                            <Menu.Positioner className="outline-none" sideOffset={4}>
                              <Menu.Popup className="min-w-[160px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                                <Menu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                                  Deep Action 1
                                </Menu.Item>
                                <Menu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                                  Deep Action 2
                                </Menu.Item>
                                <Menu.Separator className="my-1 h-px bg-gray-200" />
                                <Menu.Item className="text-red-600 cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                                  Deep Delete
                                </Menu.Item>
                              </Menu.Popup>
                            </Menu.Positioner>
                          </Menu.Portal>
                        </Menu.SubmenuRoot>

                        <ContextMenu.Separator className="my-1 h-px bg-gray-200" />
                        <ContextMenu.Item className="text-red-600 cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                          Nested Delete
                        </ContextMenu.Item>
                      </ContextMenu.Popup>
                    </ContextMenu.Positioner>
                  </ContextMenu.Portal>
                </ContextMenu.Root>

                <ContextMenu.Separator className="my-1 h-px bg-gray-200" />
                <ContextMenu.Item className="text-red-600 cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                  Delete
                </ContextMenu.Item>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      </section>

      {/* Scenario 4: [FINAL BOSS ⚔️] Nested context menu with a menu inside */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          4. [FINAL BOSS ⚔️] Nested context menus, popover with a menu and a context menu inside
        </h2>
        <p className="text-gray-600">
          Right-click the outer box, then right-click the inner box. Inside the inner context menu,
          open the popover, then open the menu inside the popover, then right-click the context menu
          inside the popover.
        </p>

        <ContextMenu.Root>
          <ContextMenu.Trigger className="border-cyan-300 bg-cyan-50 rounded-lg border-2 p-8">
            <div className="text-center">
              <span className="text-cyan-700 block font-medium">Outer Context Menu</span>
              <span className="text-cyan-600 block text-sm">Right-click me</span>

              <ContextMenu.Root>
                <ContextMenu.Trigger className="border-cyan-300 bg-cyan-50 rounded-lg border-2 p-8 flex flex-col items-center justify-center mt-4">
                  <div className="text-center">
                    <span className="text-cyan-700 block font-medium">Inner Context Menu</span>
                    <span className="text-cyan-600 block text-sm">Right-click me</span>

                    <Popover.Root>
                      <Popover.Trigger className="flex p-4 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100 mt-2">
                        Open popover
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Positioner sideOffset={8}>
                          <Popover.Popup className="origin-[var(--transform-origin)] rounded-lg bg-[canvas] px-6 py-4 text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
                            <div className="text-base text-gray-600 flex flex-col gap-2">
                              <Menu.Root>
                                <Menu.Trigger className="inline-flex cursor-default items-center gap-2 rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50">
                                  Open Actions Menu
                                </Menu.Trigger>
                                <Menu.Portal>
                                  <Menu.Positioner className="outline-none" side="top">
                                    <Menu.Popup className="min-w-[180px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                                      <Menu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                                        Menu Action
                                      </Menu.Item>
                                    </Menu.Popup>
                                  </Menu.Positioner>
                                </Menu.Portal>
                              </Menu.Root>

                              <ContextMenu.Root>
                                <ContextMenu.Trigger className="border-red-300 bg-red-50 mt-4 inline-block rounded border-2 p-4">
                                  <span className="text-red-700 block font-medium">
                                    Popover Context Menu
                                  </span>
                                  <span className="text-red-600 block text-sm">
                                    Right-click me!
                                  </span>
                                </ContextMenu.Trigger>
                                <ContextMenu.Portal>
                                  <ContextMenu.Positioner className="outline-none">
                                    <ContextMenu.Popup className="min-w-[180px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                                      <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                                        Popover context Action 1
                                      </ContextMenu.Item>
                                    </ContextMenu.Popup>
                                  </ContextMenu.Positioner>
                                </ContextMenu.Portal>
                              </ContextMenu.Root>
                            </div>
                          </Popover.Popup>
                        </Popover.Positioner>
                      </Popover.Portal>
                    </Popover.Root>
                  </div>
                </ContextMenu.Trigger>
                <ContextMenu.Portal>
                  <ContextMenu.Positioner className="outline-none">
                    <ContextMenu.Popup className="min-w-[220px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                      <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                        Inner Action
                      </ContextMenu.Item>
                    </ContextMenu.Popup>
                  </ContextMenu.Positioner>
                </ContextMenu.Portal>
              </ContextMenu.Root>
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner className="outline-none">
              <ContextMenu.Popup className="min-w-[220px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                  Outer Action
                </ContextMenu.Item>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      </section>

      {/* Scenario 5: Disabled context menu */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">5. Disabled Context Menu</h2>
        <p className="text-gray-600">
          Toggle the checkbox to disable the context menu. When disabled, right-clicking will not
          open the menu.
        </p>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={disabled}
            onChange={(event) => setDisabled(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Disable context menu</span>
        </label>

        <ContextMenu.Root disabled={disabled}>
          <ContextMenu.Trigger className="rounded-lg border-2 p-8 transition-colors border-indigo-300 bg-indigo-50">
            <div className="text-center">
              <span
                className={`block font-medium ${disabled ? 'text-gray-500' : 'text-indigo-700'}`}
              >
                Right-click here
              </span>
              <span className={`block text-sm ${disabled ? 'text-gray-400' : 'text-indigo-600'}`}>
                {disabled ? 'Context menu is disabled' : 'Context menu will open on right-click'}
              </span>
            </div>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner className="outline-none">
              <ContextMenu.Popup className="min-w-[180px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
                <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                  Cut
                </ContextMenu.Item>
                <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                  Copy
                </ContextMenu.Item>
                <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                  Paste
                </ContextMenu.Item>
                <ContextMenu.Separator className="my-1 h-px bg-gray-200" />
                <ContextMenu.Item className="cursor-default px-3 py-2 text-sm hover:bg-gray-100">
                  Select All
                </ContextMenu.Item>
                <ContextMenu.Separator className="my-1 h-px bg-gray-200" />
                <ContextMenu.Item className="cursor-default px-3 py-2 text-sm text-red-600 hover:bg-gray-100">
                  Delete
                </ContextMenu.Item>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      </section>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M3.5 9L7.5 5L3.5 1" stroke="currentcolor" strokeWidth="1.5" />
    </svg>
  );
}
