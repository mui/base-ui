'use client';
import * as React from 'react';
import { Select } from '@base-ui/react/select';

const fonts = ['Sans-serif', 'Serif', 'Monospace', 'Cursive'];

export default function SelectKeepMounted() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 24 }}>
      <SelectDemo label="Default (unmounts when closed)" />
      <button type="button">Focusable button</button>
      <SelectDemo label="keepMounted" keepMounted />
    </div>
  );
}

function SelectDemo({ label, keepMounted }: { label: string; keepMounted?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span>{label}</span>
      <Select.Root defaultValue="Serif">
        <Select.Trigger style={{ minWidth: 160 }}>
          <Select.Value />
        </Select.Trigger>
        <Select.Portal keepMounted={keepMounted}>
          <Select.Positioner sideOffset={8}>
            <Select.Popup
              style={{ background: 'white', color: 'black', border: '1px solid black', padding: 4 }}
            >
              {fonts.map((font) => (
                <Select.Item key={font} value={font} style={{ padding: '4px 8px' }}>
                  <Select.ItemText>{font}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
