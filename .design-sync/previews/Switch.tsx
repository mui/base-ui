import * as React from 'react';
import { Switch } from '@base-ui/react';
import './Switch.css';

export const Basic = () => (
  <label className="Label">
    <Switch.Root defaultChecked className="Switch">
      <Switch.Thumb className="Thumb" />
    </Switch.Root>
    Notifications
  </label>
);

export const Unchecked = () => (
  <label className="Label">
    <Switch.Root className="Switch">
      <Switch.Thumb className="Thumb" />
    </Switch.Root>
    Airplane mode
  </label>
);

export const Disabled = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <label className="Label">
      <Switch.Root disabled className="Switch">
        <Switch.Thumb className="Thumb" />
      </Switch.Root>
      Disabled, off
    </label>
    <label className="Label">
      <Switch.Root disabled defaultChecked className="Switch">
        <Switch.Thumb className="Thumb" />
      </Switch.Root>
      Disabled, on
    </label>
  </div>
);
