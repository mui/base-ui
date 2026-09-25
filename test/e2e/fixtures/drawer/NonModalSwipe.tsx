import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';

export default function NonModalSwipe() {
  return (
    <Drawer.Root defaultOpen modal={false} disablePointerDismissal swipeDirection="right">
      <Drawer.Trigger>Open drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Viewport style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
          <Drawer.Popup
            data-testid="popup"
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              width: 300,
              height: '100%',
              pointerEvents: 'auto',
            }}
          >
            <Drawer.Title>Non-modal drawer</Drawer.Title>
            <Drawer.Description>Drag the popup to dismiss it.</Drawer.Description>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
