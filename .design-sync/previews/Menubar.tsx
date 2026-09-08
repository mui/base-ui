import * as React from 'react';
import { Menubar, Menu } from '@base-ui/react';
import './Menubar.css';

function CaretRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M6 12V4l4.5 4z" />
    </svg>
  );
}

export const Basic = () => (
  <Menubar className="Menubar" modal={false}>
    <Menu.Root defaultOpen modal={false}>
      <Menu.Trigger className="MenuTrigger">File</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="MenuPositioner" sideOffset={4}>
          <Menu.Popup className="MenuPopup">
            <Menu.Item className="MenuItem">New</Menu.Item>
            <Menu.Item className="MenuItem">Open</Menu.Item>
            <Menu.Item className="MenuItem">Save</Menu.Item>

            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger className="SubmenuTrigger">
                Export
                <CaretRightIcon />
              </Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner className="MenuPositioner" sideOffset={-4} alignOffset={-4}>
                  <Menu.Popup className="MenuPopup">
                    <Menu.Item className="MenuItem">PDF</Menu.Item>
                    <Menu.Item className="MenuItem">PNG</Menu.Item>
                    <Menu.Item className="MenuItem">SVG</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>

            <Menu.Separator className="MenuSeparator" />
            <Menu.Item className="MenuItem">Print</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>

    <Menu.Root modal={false}>
      <Menu.Trigger className="MenuTrigger">Edit</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="MenuPositioner" sideOffset={4}>
          <Menu.Popup className="MenuPopup">
            <Menu.Item className="MenuItem">Cut</Menu.Item>
            <Menu.Item className="MenuItem">Copy</Menu.Item>
            <Menu.Item className="MenuItem">Paste</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>

    <Menu.Root modal={false}>
      <Menu.Trigger className="MenuTrigger">View</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="MenuPositioner" sideOffset={4}>
          <Menu.Popup className="MenuPopup">
            <Menu.Item className="MenuItem">Zoom In</Menu.Item>
            <Menu.Item className="MenuItem">Zoom Out</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>

    <Menu.Root disabled modal={false}>
      <Menu.Trigger className="MenuTrigger">Help</Menu.Trigger>
    </Menu.Root>
  </Menubar>
);

export const SubmenuOpen = () => (
  <Menubar className="Menubar" modal={false}>
    <Menu.Root defaultOpen modal={false}>
      <Menu.Trigger className="MenuTrigger">File</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="MenuPositioner" sideOffset={4}>
          <Menu.Popup className="MenuPopup">
            <Menu.Item className="MenuItem">New</Menu.Item>
            <Menu.Item className="MenuItem">Open</Menu.Item>
            <Menu.Item className="MenuItem">Save</Menu.Item>

            <Menu.SubmenuRoot defaultOpen>
              <Menu.SubmenuTrigger className="SubmenuTrigger">
                Export
                <CaretRightIcon />
              </Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner className="MenuPositioner" sideOffset={-4} alignOffset={-4}>
                  <Menu.Popup className="MenuPopup">
                    <Menu.Item className="MenuItem">PDF</Menu.Item>
                    <Menu.Item className="MenuItem">PNG</Menu.Item>
                    <Menu.Item className="MenuItem">SVG</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>

            <Menu.Separator className="MenuSeparator" />
            <Menu.Item className="MenuItem">Print</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>

    <Menu.Root modal={false}>
      <Menu.Trigger className="MenuTrigger">Edit</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="MenuPositioner" sideOffset={4}>
          <Menu.Popup className="MenuPopup">
            <Menu.Item className="MenuItem">Cut</Menu.Item>
            <Menu.Item className="MenuItem">Copy</Menu.Item>
            <Menu.Item className="MenuItem">Paste</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  </Menubar>
);
