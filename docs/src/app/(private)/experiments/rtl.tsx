'use client';
import * as React from 'react';
import { DirectionProvider } from '@base-ui-components/react/direction-provider';
import { Menu } from '@base-ui-components/react/menu';
import { Popover } from '@base-ui-components/react/popover';
import { PreviewCard } from '@base-ui-components/react/preview-card';
import c from './rtl.module.css';

const dir = 'rtl';

export default function RtlNestedMenu() {
  const createHandleMenuClick = (menuItem: string) => {
    return () => {
      console.log(`Clicked on ${menuItem}`);
    };
  };

  return (
    <div className={c.rtl} dir={dir}>
      <DirectionProvider direction={dir}>
        <Menu.Root>
          <Menu.Trigger className={c.trigger}>Menu.Trigger</Menu.Trigger>
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
                  dir={dir}
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
                  dir={dir}
                >
                  <Menu.Popup className={c.popup}>
                    <Menu.Root>
                      <Menu.SubmenuTrigger className={c.submenutrigger}>
                        Heading
                      </Menu.SubmenuTrigger>
                      <Menu.Positioner
                        align="start"
                        side="inline-end"
                        className={c.positioner}
                        dir={dir}
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
                        dir={dir}
                      >
                        <Menu.Popup className={c.popup}>
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

        <PreviewCard.Root>
          <PreviewCard.Trigger href="#" className={c.trigger}>
            PreviewCard.Trigger
          </PreviewCard.Trigger>
          <PreviewCard.Positioner
            sideOffset={8}
            side="inline-end"
            align="center"
            className={c.positioner}
            dir={dir}
          >
            <PreviewCard.Popup className={c.popup}>
              <img
                src="https://pbs.twimg.com/profile_images/1798056009291997184/B-prVmUP_400x400.jpg"
                alt="Base UI Logo"
                width={80}
                height={80}
                style={{ borderRadius: '50%' }}
              />
              <h2 style={{ fontSize: 20, margin: 0 }}>Base UI</h2>
              <p>
                Unstyled React components and hooks (@base-ui-components/react), by
                @MUI_hq.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <span>
                  <strong>1</strong> Following
                </span>
                <span>
                  <strong>1,000</strong> Followers
                </span>
              </div>
              <PreviewCard.Arrow className={c.arrow} />
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Root>

        <Popover.Root>
          <Popover.Trigger className={c.trigger}>Popover.Trigger</Popover.Trigger>
          <Popover.Positioner sideOffset={8} side="inline-end">
            <Popover.Popup className={c.popup}>
              <Popover.Title>Popover Title</Popover.Title>
              <Popover.Description>Popover Description</Popover.Description>
              <Popover.Arrow className={c.arrow} />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Root>
      </DirectionProvider>
    </div>
  );
}
