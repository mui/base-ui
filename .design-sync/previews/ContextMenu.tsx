import * as React from 'react';
import { ContextMenu } from '@base-ui/react';
import './ContextMenu.css';

export const Basic = () => (
  <ContextMenu.Root defaultOpen>
    <ContextMenu.Trigger className="Trigger">Right click here</ContextMenu.Trigger>
    <ContextMenu.Portal>
      <ContextMenu.Positioner className="Positioner">
        <ContextMenu.Popup className="Popup">
          <ContextMenu.Item className="Item">Add to Library</ContextMenu.Item>
          <ContextMenu.Item className="Item">Add to Playlist</ContextMenu.Item>
          <ContextMenu.Separator className="Separator" />
          <ContextMenu.Item className="Item">Play Next</ContextMenu.Item>
          <ContextMenu.Item className="Item">Play Last</ContextMenu.Item>
          <ContextMenu.Separator className="Separator" />
          <ContextMenu.Item className="Item">Favorite</ContextMenu.Item>
          <ContextMenu.Item className="Item">Share</ContextMenu.Item>
        </ContextMenu.Popup>
      </ContextMenu.Positioner>
    </ContextMenu.Portal>
  </ContextMenu.Root>
);
