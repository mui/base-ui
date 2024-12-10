'use client';
import * as React from 'react';
import { Select as BaseSelect } from '@base-ui-components/react/select';

const items = [...Array(1000)].map((_, i) => `Item ${i + 1}`);

const arrowStyles: React.CSSProperties = {
  width: 'calc(100% - 2px)',
  margin: '0 auto',
  textAlign: 'center',
  background: 'white',
  fontSize: 12,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginInline: 1,
};

function BaseSelectExample() {
  return (
    <BaseSelect.Root>
      <BaseSelect.Trigger
        aria-label="Select"
        style={{
          fontSize: 16,
          border: 'none',
          lineHeight: 1,
          fontFamily: 'Arial',
        }}
      >
        <BaseSelect.Value placeholder="Select..." />
      </BaseSelect.Trigger>
      <BaseSelect.Positioner>
        <BaseSelect.ScrollUpArrow
          style={{
            ...arrowStyles,
            top: 0,
            marginTop: 1,
          }}
        />
        <BaseSelect.Popup
          style={{
            padding: '1rem 0.5rem',
            border: '1px solid black',
            background: 'white',
            fontSize: 16,
            fontFamily: 'Arial',
            scrollPadding: 15,
          }}
        >
          {items.map((item) => (
            <BaseSelect.Item key={item} value={item} style={{ lineHeight: 1 }}>
              <BaseSelect.ItemText>{item}</BaseSelect.ItemText>
            </BaseSelect.Item>
          ))}
        </BaseSelect.Popup>
        <BaseSelect.ScrollDownArrow
          style={{
            ...arrowStyles,
            bottom: 0,
            marginBottom: 1,
          }}
        />
      </BaseSelect.Positioner>
    </BaseSelect.Root>
  );
}

export default function SelectPerf() {
  return (
    <React.Fragment>
      <h2>Base UI Select </h2>
      <BaseSelectExample />
    </React.Fragment>
  );
}
