'use client';
import * as React from 'react';
import { Select as BaseSelect } from '@base_ui/react/Select';
import * as Select from '@radix-ui/react-select';

const options = [...Array(1000)].map((_, i) => `Item ${i + 1}`);

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
        style={{ fontSize: 16, border: 'none', lineHeight: 1, fontFamily: 'Arial' }}
      >
        <BaseSelect.Value placeholder="Select..." />
      </BaseSelect.Trigger>
      <BaseSelect.Positioner style={{ margin: '10px 0' }}>
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
          }}
        >
          {options.map((item) => (
            <BaseSelect.Option
              key={item}
              value={item}
              style={{ scrollMargin: 15, lineHeight: 1 }}
            >
              <BaseSelect.OptionText>{item}</BaseSelect.OptionText>
            </BaseSelect.Option>
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

function RadixSelectExample() {
  return (
    <Select.Root>
      <Select.Trigger aria-label="Food">
        <Select.Value placeholder="Select a fruit…" />
        <Select.Icon />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content>
          <Select.ScrollUpButton />
          <Select.Viewport>
            {options.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

const SelectItem = React.forwardRef(function SelectItem(
  { children, className, ...props }: any,
  forwardedRef,
) {
  return (
    <Select.Item {...props} ref={forwardedRef}>
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator />
    </Select.Item>
  );
});

export default function SelectPerf() {
  return (
    <React.Fragment>
      <h2>Base UI Select 2</h2>
      <BaseSelectExample />
      <h2>Radix UI Select</h2>
      <RadixSelectExample />
    </React.Fragment>
  );
}
