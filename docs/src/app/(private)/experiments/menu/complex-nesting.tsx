'use client';
import { Menu } from '@base-ui/react/menu';
import { Dialog } from '@base-ui/react/dialog';
import styles from './menu.module.css';

export default function MenuComplexNestingExperiment() {
  return (
    <div className="space-y-12 p-8">
      <h1 className="text-2xl font-bold">Menu Complex Nesting Experiments</h1>
      <p className="text-gray-600">
        Testing how independent menus work when nested in React tree through dialogs and other
        components.
      </p>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Menu → Item → Dialog → Menu</h2>
        <p className="text-gray-600">
          Click the menu button, select "Open Settings", then use the menu inside the dialog. The
          dialog is opened from within a menu item.
        </p>

        <Menu.Root>
          <Menu.Trigger className={styles.Button}>Main Menu</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner className={styles.Positioner}>
              <Menu.Popup className={styles.Popup}>
                <Menu.Item className={styles.Item}>New File</Menu.Item>
                <Menu.Item className={styles.Item}>Save</Menu.Item>

                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger className={styles.SubmenuTrigger}>
                    Export
                    <ChevronRightIcon />
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner className={styles.Positioner} sideOffset={4}>
                      <Menu.Popup className={styles.Popup}>
                        <Menu.Item className={styles.Item}>Export as PDF</Menu.Item>
                        <Menu.Item className={styles.Item}>Export as PNG</Menu.Item>
                        <Menu.Item className={styles.Item}>Export as SVG</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>

                <Menu.Separator className={styles.Separator} />

                <Dialog.Root>
                  <Menu.Item
                    render={<Dialog.Trigger />}
                    className={styles.Item}
                    closeOnClick={false}
                    nativeButton
                  >
                    Open Settings
                  </Menu.Item>

                  <Dialog.Portal>
                    <Dialog.Backdrop className="fixed inset-0 bg-black/50" />
                    <Dialog.Popup className="fixed top-1/2 left-1/2 w-[500px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 transform rounded-lg bg-white p-6 shadow-xl">
                      <Dialog.Title className="mb-4 text-xl font-semibold">
                        Settings (Nested Dialog)
                      </Dialog.Title>

                      <div className="space-y-4">
                        <p className="text-gray-600">
                          This dialog is nested within the menu popup. It contains an independent
                          menu.
                        </p>

                        {/* Menu nested within Dialog which is nested within Menu */}
                        <div className="rounded-lg border bg-gray-50 p-4">
                          <h3 className="mb-3 font-medium">Theme Settings</h3>
                          <Menu.Root>
                            <Menu.Trigger className={styles.Button}>Theme Options</Menu.Trigger>
                            <Menu.Portal>
                              <Menu.Positioner className={styles.Positioner}>
                                <Menu.Popup className={styles.Popup}>
                                  <Menu.Item className={styles.Item}>Light Theme</Menu.Item>
                                  <Menu.Item className={styles.Item}>Dark Theme</Menu.Item>

                                  <Menu.SubmenuRoot>
                                    <Menu.SubmenuTrigger className={styles.SubmenuTrigger}>
                                      Advanced
                                      <ChevronRightIcon />
                                    </Menu.SubmenuTrigger>
                                    <Menu.Portal>
                                      <Menu.Positioner className={styles.Positioner} sideOffset={4}>
                                        <Menu.Popup className={styles.Popup}>
                                          <Menu.Item className={styles.Item}>
                                            Custom Colors
                                          </Menu.Item>
                                          <Menu.Item className={styles.Item}>
                                            Font Settings
                                          </Menu.Item>
                                          <Menu.Separator className={styles.Separator} />
                                          <Menu.Item className={styles.Item}>
                                            Reset to Default
                                          </Menu.Item>
                                        </Menu.Popup>
                                      </Menu.Positioner>
                                    </Menu.Portal>
                                  </Menu.SubmenuRoot>

                                  <Menu.Separator className={styles.Separator} />
                                  <Menu.Item className={styles.Item}>Auto Theme</Menu.Item>
                                </Menu.Popup>
                              </Menu.Positioner>
                            </Menu.Portal>
                          </Menu.Root>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Dialog.Close className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100">
                            Cancel
                          </Dialog.Close>
                          <Dialog.Close className="bg-blue-600 hover:bg-blue-700 rounded px-4 py-2">
                            Save
                          </Dialog.Close>
                        </div>
                      </div>
                    </Dialog.Popup>
                  </Dialog.Portal>
                </Dialog.Root>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
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
