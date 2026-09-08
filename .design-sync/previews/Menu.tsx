import * as React from 'react';
import { Menu } from '@base-ui/react';
import './Menu.css';

function CaretDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 6H4l4 4.5z" />
    </svg>
  );
}

export const Basic = () => (
  <Menu.Root defaultOpen modal={false}>
    <Menu.Trigger className="Button">
      Song <CaretDownIcon />
    </Menu.Trigger>
    <Menu.Portal>
      <Menu.Positioner className="Positioner" sideOffset={8} align="start">
        <Menu.Popup className="Popup">
          <Menu.Item className="Item">Add to Library</Menu.Item>
          <Menu.Item className="Item">Add to Playlist</Menu.Item>
          <Menu.Separator className="Separator" />
          <Menu.Item className="Item">Play Next</Menu.Item>
          <Menu.Item className="Item">Play Last</Menu.Item>
          <Menu.Separator className="Separator" />
          <Menu.Item className="Item">Favorite</Menu.Item>
          <Menu.Item className="Item">Share</Menu.Item>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root>
);

export const WithDisabledItem = () => (
  <Menu.Root defaultOpen modal={false}>
    <Menu.Trigger className="Button">
      Song <CaretDownIcon />
    </Menu.Trigger>
    <Menu.Portal>
      <Menu.Positioner className="Positioner" sideOffset={8} align="start">
        <Menu.Popup className="Popup">
          <Menu.Item className="Item">Add to Library</Menu.Item>
          <Menu.Item className="Item" disabled>
            Add to Playlist
          </Menu.Item>
          <Menu.Separator className="Separator" />
          <Menu.Item className="Item">Play Next</Menu.Item>
          <Menu.Item className="Item">Play Last</Menu.Item>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root>
);
