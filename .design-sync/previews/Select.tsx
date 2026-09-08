import * as React from 'react';
import { Select } from '@base-ui/react';
import './Select.css';

const apples = [
  { label: 'Gala', value: 'gala' },
  { label: 'Fuji', value: 'fuji' },
  { label: 'Honeycrisp', value: 'honeycrisp' },
  { label: 'Granny Smith', value: 'granny-smith' },
  { label: 'Pink Lady', value: 'pink-lady' },
];

function CaretUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

export const Basic = () => (
  <div className="Field">
    <Select.Root items={apples} defaultOpen modal={false}>
      <Select.Label className="Label">Apple</Select.Label>
      <Select.Trigger className="Select">
        <Select.Value className="Value" placeholder="Select apple" />
        <Select.Icon>
          <CaretUpDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="Positioner" sideOffset={4}>
          <Select.Popup className="Popup">
            <Select.List className="List">
              {apples.map(({ label, value }) => (
                <Select.Item key={label} value={value} className="Item">
                  <Select.ItemIndicator className="ItemIndicator">
                    <CheckIcon />
                  </Select.ItemIndicator>
                  <Select.ItemText className="ItemText">{label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  </div>
);

export const Disabled = () => (
  <div className="Field">
    <Select.Root items={apples} disabled modal={false}>
      <Select.Label className="Label">Apple</Select.Label>
      <Select.Trigger className="Select">
        <Select.Value className="Value" placeholder="Select apple" />
        <Select.Icon>
          <CaretUpDownIcon />
        </Select.Icon>
      </Select.Trigger>
    </Select.Root>
  </div>
);
