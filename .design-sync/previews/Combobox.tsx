import * as React from 'react';
import { Combobox } from '@base-ui/react';
import './Combobox.css';

interface Fruit {
  label: string;
  value: string;
}

const fruits: Fruit[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Orange', value: 'orange' },
  { label: 'Pineapple', value: 'pineapple' },
  { label: 'Grape', value: 'grape' },
  { label: 'Mango', value: 'mango' },
];

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
  <Combobox.Root items={fruits} defaultValue={fruits[0]} defaultOpen modal={false}>
    <div className="Label">
      <label htmlFor="combobox-basic-input">Choose a fruit</label>
      <Combobox.InputGroup className="InputGroup">
        <Combobox.Input placeholder="e.g. Apple" id="combobox-basic-input" className="Input" />
        <div className="ActionButtons">
          <Combobox.Trigger className="Trigger" aria-label="Open popup">
            <CaretDownIcon />
          </Combobox.Trigger>
        </div>
      </Combobox.InputGroup>
    </div>

    <Combobox.Portal>
      <Combobox.Positioner className="Positioner" sideOffset={4}>
        <Combobox.Popup className="Popup">
          <Combobox.List className="List">
            {(item: Fruit) => (
              <Combobox.Item key={item.value} value={item} className="Item">
                <Combobox.ItemIndicator className="ItemIndicator">
                  <CheckIcon />
                </Combobox.ItemIndicator>
                <span className="ItemText">{item.label}</span>
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Portal>
  </Combobox.Root>
);

export const Disabled = () => (
  <Combobox.Root items={fruits} disabled modal={false}>
    <div className="Label">
      <label htmlFor="combobox-disabled-input">Choose a fruit</label>
      <Combobox.InputGroup className="InputGroup">
        <Combobox.Input
          placeholder="e.g. Apple"
          id="combobox-disabled-input"
          className="Input"
        />
        <div className="ActionButtons">
          <Combobox.Trigger className="Trigger" aria-label="Open popup">
            <CaretDownIcon />
          </Combobox.Trigger>
        </div>
      </Combobox.InputGroup>
    </div>
  </Combobox.Root>
);
