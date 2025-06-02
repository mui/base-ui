'use client';
import * as React from 'react';
import { ContextMenu } from '@base-ui-components/react/context-menu';
import { Menu } from '@base-ui-components/react/menu';

export default function ContextMenuExperiment() {
  return (
    <div className="space-y-12 p-8">
      <h1 className="text-2xl font-bold">Context Menu Nesting Experiments</h1>

      {/* Scenario 1: Context menu within a context menu trigger */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          1. Context Menu within Context Menu Trigger
        </h2>
        <p className="text-gray-600">
          Right-click on the outer box, then right-click on the inner box to see
          nested context menus.
        </p>

        <ContextMenu.Root>
          <ContextMenu.Trigger className="border-blue-300 bg-blue-50 rounded-lg border-2 p-8">
            <div className="text-center">
              <span className="text-blue-700 block font-medium">
                Outer Context Menu
              </span>
              <span className="text-blue-600 block text-sm">Right-click me</span>

              <ContextMenu.Root>
                <ContextMenu.Trigger className="border-red-300 bg-red-50 mt-4 inline-block rounded border-2 p-4">
                  <span className="text-red-700 block font-medium">
                    Inner Context Menu
                  </span>
                  <span className="text-red-600 block text-sm">
                    Right-click me too!
                  </span>
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
        <h2 className="text-xl font-semibold">
          2. Nested Context Menus with Submenus
        </h2>
        <p className="text-gray-600">
          Right-click on either box and explore the submenu options.
        </p>

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
                  <span className="text-purple-600 block text-sm">
                    Right-click me too!
                  </span>
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
        <h2 className="text-xl font-semibold">
          3. Context Menu within Context Menu Popup Item
        </h2>
        <p className="text-gray-600">
          Right-click on the box, then right-click on the "Special Item" in the
          popup.
        </p>

        <ContextMenu.Root>
          <ContextMenu.Trigger className="border-orange-300 bg-orange-50 rounded-lg border-2 p-8">
            <div className="text-center">
              <span className="text-orange-700 block font-medium">
                Complex Context Menu
              </span>
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
