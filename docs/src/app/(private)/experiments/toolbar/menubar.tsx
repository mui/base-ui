'use client';
import * as React from 'react';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { Menu } from '@base-ui-components/react/menu';
import toolbarClasses from './toolbar.module.css';
import triggerToolbarClasses from './triggers.module.css';
import switchClasses from '../../../(public)/(content)/react/components/switch/demos/hero/css-modules/index.module.css';
import dialogClasses from '../../../(public)/(content)/react/components/alert-dialog/demos/hero/css-modules/index.module.css';
import menuClasses from '../../../(public)/(content)/react/components/menu/demos/submenu/css-modules/index.module.css';
import { ArrowSvg, ChevronRightIcon } from './_icons';

const styles = {
  demo: triggerToolbarClasses,
  toolbar: toolbarClasses,
  switch: switchClasses,
  dialog: dialogClasses,
  menu: menuClasses,
};

export default function App() {
  return (
    <div style={{ width: '800px', padding: '40px' }}>
      <a
        className={styles.toolbar.a}
        href="https://www.w3.org/WAI/ARIA/apg/patterns/menubar/"
        target="_blank"
        rel="noreferrer"
      >
        <h3 className={styles.toolbar.h3}>Menubar pattern</h3>
      </a>
      <div className={styles.toolbar.Wrapper}>
        <Toolbar.Root className={styles.toolbar.Root}>
          <Menu.Root>
            <Toolbar.Button
              render={<Menu.Trigger />}
              className={styles.toolbar.More}
            >
              File
            </Toolbar.Button>
            <Menu.Portal>
              <Menu.Positioner
                className={styles.menu.Positioner}
                align="start"
                side="bottom"
                sideOffset={8}
              >
                <Menu.Popup
                  className={styles.menu.Popup}
                  style={{ backgroundColor: 'canvas' }}
                >
                  <Menu.Arrow
                    className={styles.menu.Arrow}
                    style={{
                      color: 'canvas',
                    }}
                  >
                    <ArrowSvg className={styles.toolbar.ArrowSvg} />
                  </Menu.Arrow>
                  <Menu.Item className={styles.menu.Item}>New File</Menu.Item>
                  <Menu.Item className={styles.menu.Item}>Open</Menu.Item>
                  <Menu.Separator className={styles.menu.Separator} />
                  <Menu.Root>
                    <Menu.SubmenuTrigger className={styles.menu.SubmenuTrigger}>
                      Open Recent
                      <ChevronRightIcon />
                    </Menu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner
                        className={styles.menu.Positioner}
                        alignOffset={-4}
                        sideOffset={-4}
                      >
                        <Menu.Popup className={styles.menu.Popup}>
                          <Menu.Item className={styles.menu.Item}>
                            ~/base-ui.git/packages/react/src/use-button/useButton.ts
                          </Menu.Item>
                          <Menu.Item className={styles.menu.Item}>
                            ~/base-ui.git/packages/react/src/utils/constants.ts
                          </Menu.Item>
                          <Menu.Item className={styles.menu.Item}>
                            ~/base-ui.git/packages/react/src/utils/evaluateRenderProps.ts
                          </Menu.Item>
                          <Menu.Item className={styles.menu.Item}>
                            ~/base-ui.git/packages/react/src/utils/mergeReactProps.ts
                          </Menu.Item>
                          <Menu.Item className={styles.menu.Item}>
                            ~/base-ui.git/packages/react/src/index.ts
                          </Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.Root>
                  <Menu.Separator className={styles.menu.Separator} />
                  <Menu.Item className={styles.menu.Item} disabled>
                    Close Editor
                  </Menu.Item>
                  <Menu.Item className={styles.menu.Item}>Close Window</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>

          <Menu.Root>
            <Toolbar.Button
              render={<Menu.Trigger />}
              className={styles.toolbar.More}
            >
              View
            </Toolbar.Button>
            <Menu.Portal>
              <Menu.Positioner
                className={styles.menu.Positioner}
                align="start"
                side="bottom"
                sideOffset={8}
              >
                <Menu.Popup
                  className={styles.menu.Popup}
                  style={{ backgroundColor: 'canvas' }}
                >
                  <Menu.Arrow
                    className={styles.menu.Arrow}
                    style={{
                      color: 'canvas',
                    }}
                  >
                    <ArrowSvg className={styles.toolbar.ArrowSvg} />
                  </Menu.Arrow>
                  <Menu.Root>
                    <Menu.SubmenuTrigger className={styles.menu.SubmenuTrigger}>
                      Editor Layout
                      <ChevronRightIcon />
                    </Menu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner
                        className={styles.menu.Positioner}
                        alignOffset={-4}
                        sideOffset={-4}
                      >
                        <Menu.Popup className={styles.menu.Popup}>
                          <Menu.Item className={styles.menu.Item}>
                            Split Up
                          </Menu.Item>
                          <Menu.Item className={styles.menu.Item}>
                            Split Down
                          </Menu.Item>
                          <Menu.Item className={styles.menu.Item}>
                            Split Left
                          </Menu.Item>
                          <Menu.Item className={styles.menu.Item}>
                            Split Right
                          </Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.Root>
                  <Menu.Separator className={styles.menu.Separator} />
                  <Menu.Item className={styles.menu.Item}>Explorer</Menu.Item>
                  <Menu.Item className={styles.menu.Item}>Search</Menu.Item>
                  <Menu.Separator className={styles.menu.Separator} />
                  <Menu.Item className={styles.menu.Item} disabled>
                    Debug Console
                  </Menu.Item>
                  <Menu.Item className={styles.menu.Item}>Terminal</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>

          <Menu.Root>
            <Toolbar.Button
              render={<Menu.Trigger />}
              className={styles.toolbar.More}
            >
              Go
            </Toolbar.Button>
            <Menu.Portal>
              <Menu.Positioner
                className={styles.menu.Positioner}
                align="start"
                side="bottom"
                sideOffset={8}
              >
                <Menu.Popup
                  className={styles.menu.Popup}
                  style={{ backgroundColor: 'canvas' }}
                >
                  <Menu.Arrow
                    className={styles.menu.Arrow}
                    style={{
                      color: 'canvas',
                    }}
                  >
                    <ArrowSvg className={styles.toolbar.ArrowSvg} />
                  </Menu.Arrow>
                  <Menu.Item className={styles.menu.Item}>Back</Menu.Item>
                  <Menu.Item className={styles.menu.Item}>Forward</Menu.Item>
                  <Menu.Item className={styles.menu.Item}>
                    Last Edit Location
                  </Menu.Item>
                  <Menu.Separator className={styles.menu.Separator} />
                  <Menu.Root>
                    <Menu.SubmenuTrigger className={styles.menu.SubmenuTrigger}>
                      Switch Group
                      <ChevronRightIcon />
                    </Menu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner
                        className={styles.menu.Positioner}
                        alignOffset={-4}
                        sideOffset={-4}
                      >
                        <Menu.Popup className={styles.menu.Popup}>
                          <Menu.Item className={styles.menu.Item}>Group 1</Menu.Item>
                          <Menu.Item className={styles.menu.Item}>Group 2</Menu.Item>
                          <Menu.Item className={styles.menu.Item}>Group 3</Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.Root>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Toolbar.Root>

        <p>this is three Menus inside a Toolbar, not a real Menubar</p>

        <a className={styles.toolbar.a} href="#">
          <h3 className={styles.toolbar.h3}>go to #</h3>
        </a>
      </div>
    </div>
  );
}
