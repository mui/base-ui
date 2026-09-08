import * as React from 'react';
import { Popover } from '@base-ui/react';
import './Popover.css';

export const Basic = () => (
  <Popover.Root defaultOpen modal={false}>
    <Popover.Trigger className="Button">Notifications</Popover.Trigger>
    <Popover.Portal>
      <Popover.Positioner sideOffset={8}>
        <Popover.Popup className="Popup">
          <Popover.Arrow className="Arrow" />
          <Popover.Title className="Title">Notifications</Popover.Title>
          <Popover.Description className="Description">
            You are all caught up. Good job!
          </Popover.Description>
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  </Popover.Root>
);

export const InfoPanel = () => (
  <Popover.Root defaultOpen modal={false}>
    <Popover.Trigger className="Button">Account limits</Popover.Trigger>
    <Popover.Portal>
      <Popover.Positioner sideOffset={8}>
        <Popover.Popup className="Popup">
          <Popover.Arrow className="Arrow" />
          <Popover.Title className="Title">Storage usage</Popover.Title>
          <Popover.Description className="Description">
            You have used 8.2 GB of your 10 GB plan. Upgrade to get more space.
          </Popover.Description>
          <div className="Actions">
            <Popover.Close className="Button">Dismiss</Popover.Close>
          </div>
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  </Popover.Root>
);

export const Disabled = () => (
  <Popover.Root modal={false}>
    <Popover.Trigger className="Button" disabled>
      Notifications
    </Popover.Trigger>
  </Popover.Root>
);
