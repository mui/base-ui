import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';

const objectItems = [
  { value: 'a', label: 'apple' },
  { value: 'b', label: 'banana' },
  { value: 'c', label: 'cherry' },
];

<Combobox.Root
  items={objectItems}
  defaultValue="a"
  onValueChange={(value) => {
    value.startsWith('a');
  }}
/>;

<Combobox.Root
  items={objectItems}
  value="a"
  onValueChange={(value) => {
    value.startsWith('a');
  }}
/>;

<Combobox.Root
  items={objectItems}
  value={objectItems[0]}
  onValueChange={(value) => {
    value.label;
  }}
/>;

<Combobox.Root
  items={objectItems}
  defaultValue={objectItems[0]}
  itemToStringLabel={(item) => {
    return item.label;
  }}
  itemToStringValue={(item) => {
    return item.value;
  }}
/>;

<Combobox.Root
  multiple
  // @ts-expect-error
  defaultValue="javascript"
  onValueChange={(value) => {
    value.pop();
  }}
/>;

<Combobox.Root
  multiple
  defaultValue={['javascript', 'typescript']}
  onValueChange={(value) => {
    value.pop();
  }}
/>;

<Combobox.Root
  multiple={false}
  // @ts-expect-error
  defaultValue={['javascript', 'typescript']}
  onValueChange={(value) => {
    // @ts-expect-error
    value.pop();
  }}
/>;

<Combobox.Root
  defaultValue="javascript"
  onValueChange={(value) => {
    // @ts-expect-error
    value.pop();
  }}
/>;

<Combobox.Root
  multiple
  onValueChange={(value) => {
    value.pop();
  }}
/>;

function App() {
  const [multiple, setMultiple] = React.useState(false);
  return (
    <Combobox.Root
      multiple={multiple}
      onValueChange={(value) => {
        // @ts-expect-error
        value.pop();
      }}
    />
  );
}

<Combobox.Root
  defaultValue="test"
  onValueChange={(value) => {
    value.length;
  }}
/>;

function App2() {
  const [value, setValue] = React.useState('a');
  return (
    <Combobox.Root
      value={value}
      onValueChange={(newValue) => {
        newValue.length;
      }}
    />
  );
}

function App3() {
  const [value, setValue] = React.useState<string | null>('a');
  return (
    <Combobox.Root
      value={value}
      onValueChange={(newValue) => {
        // @ts-expect-error
        newValue.length;
      }}
    />
  );
}
