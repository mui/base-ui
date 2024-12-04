'use client';
import * as React from 'react';
import { DirectionProvider } from '@base-ui-components/react/direction-provider';
import { Menu } from '@base-ui-components/react/menu';
import c from './menu.module.css';

const dir = 'rtl';

export default function RtlNestedMenu() {
  const createHandleMenuClick = (menuItem: string) => {
    return () => {
      console.log(`Clicked on ${menuItem}`);
    };
  };

  return (
    <div className={c.demo} dir={dir}>
      <DirectionProvider direction={dir}>
        <Menu.Root>
          <Menu.Trigger className={c.trigger}>Format</Menu.Trigger>
          <Menu.Positioner
            side="bottom"
            align="start"
            className={c.positioner}
            dir={dir}
          >
            <Menu.Popup className={c.popup}>
              <Menu.Root>
                <Menu.SubmenuTrigger className={c.submenutrigger}>
                  Text color
                </Menu.SubmenuTrigger>
                <Menu.Positioner
                  align="start"
                  side="inline-end"
                  className={c.positioner}
                >
                  <Menu.Popup className={c.popup}>
                    <Menu.Item
                      className={c.item}
                      onClick={createHandleMenuClick('Text color/Black')}
                    >
                      Black
                    </Menu.Item>
                    <Menu.Item
                      className={c.item}
                      onClick={createHandleMenuClick('Text color/Dark grey')}
                    >
                      Dark grey
                    </Menu.Item>
                    <Menu.Item
                      className={c.item}
                      onClick={createHandleMenuClick('Text color/Accent')}
                    >
                      Accent
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Root>

              <Menu.Root>
                <Menu.SubmenuTrigger className={c.submenutrigger}>
                  Style
                </Menu.SubmenuTrigger>
                <Menu.Positioner
                  align="start"
                  side="inline-end"
                  className={c.positioner}
                >
                  <Menu.Popup className={c.popup} dir={dir}>
                    <Menu.Root>
                      <Menu.SubmenuTrigger className={c.submenutrigger}>
                        Heading
                      </Menu.SubmenuTrigger>
                      <Menu.Positioner
                        align="start"
                        side="inline-end"
                        className={c.positioner}
                      >
                        <Menu.Popup className={c.popup}>
                          <Menu.Item
                            className={c.item}
                            onClick={createHandleMenuClick('Style/Heading/Level 1')}
                          >
                            Level 1
                          </Menu.Item>
                          <Menu.Item
                            className={c.item}
                            onClick={createHandleMenuClick('Style/Heading/Level 2')}
                          >
                            Level 2
                          </Menu.Item>
                          <Menu.Item
                            className={c.item}
                            onClick={createHandleMenuClick('Style/Heading/Level 3')}
                          >
                            Level 3
                          </Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Root>
                    <Menu.Item
                      className={c.item}
                      onClick={createHandleMenuClick('Style/Paragraph')}
                    >
                      Paragraph
                    </Menu.Item>
                    <Menu.Root>
                      <Menu.SubmenuTrigger className={c.submenutrigger}>
                        List
                      </Menu.SubmenuTrigger>
                      <Menu.Positioner
                        align="start"
                        side="inline-end"
                        className={c.positioner}
                      >
                        <Menu.Popup className={c.popup} dir={dir}>
                          <Menu.Item
                            className={c.item}
                            onClick={createHandleMenuClick('Style/List/Ordered')}
                          >
                            Ordered
                          </Menu.Item>
                          <Menu.Item
                            className={c.item}
                            onClick={createHandleMenuClick('Style/List/Unordered')}
                          >
                            Unordered
                          </Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Root>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Root>

              <Menu.Item
                className={c.item}
                onClick={createHandleMenuClick('Clear formatting')}
              >
                Clear formatting
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>
      </DirectionProvider>
    </div>
  );
}
