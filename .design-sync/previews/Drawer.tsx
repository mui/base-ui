import * as React from 'react';
import { Drawer } from '@base-ui/react';
import './Drawer.css';

export const Basic = () => (
  <Drawer.Root swipeDirection="right" defaultOpen modal={false}>
    <Drawer.Trigger className="Button">Open drawer</Drawer.Trigger>
    <Drawer.Portal>
      <Drawer.Backdrop className="Backdrop" />
      <Drawer.Viewport className="Viewport">
        <Drawer.Popup className="Popup">
          <Drawer.Content className="Content">
            <Drawer.Title className="Title">Drawer</Drawer.Title>
            <Drawer.Description className="Description">
              This is a drawer that slides in from the side. You can swipe to dismiss it.
            </Drawer.Description>
            <div className="Actions">
              <Drawer.Close className="Button">Close</Drawer.Close>
            </div>
          </Drawer.Content>
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  </Drawer.Root>
);
