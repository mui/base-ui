import * as React from 'react';
import { Select } from '@base-ui-components/react/select';

<Select.Root
  multiple
  // @ts-expect-error
  defaultValue="javascript"
  onValueChange={(value) => {
    value.pop();
  }}
/>;

<Select.Root
  multiple
  defaultValue={['javascript', 'typescript']}
  onValueChange={(value) => {
    value.pop();
  }}
/>;

<Select.Root
  multiple={false}
  // @ts-expect-error
  defaultValue={['javascript', 'typescript']}
  onValueChange={(value) => {
    // @ts-expect-error
    value.pop();
  }}
/>;

<Select.Root
  defaultValue="javascript"
  onValueChange={(value) => {
    // @ts-expect-error
    value.pop();
  }}
/>;

<Select.Root
  multiple
  onValueChange={(value) => {
    value.pop();
  }}
/>;

function App() {
  const [multiple, setMultiple] = React.useState(false);
  return (
    <Select.Root
      multiple={multiple}
      onValueChange={(value) => {
        // @ts-expect-error
        value.pop();
      }}
    />
  );
}

<Select.Root
  defaultValue="test"
  onValueChange={(value) => {
    value.length;
  }}
/>;

function App2() {
  const [value, setValue] = React.useState('a');
  return (
    <Select.Root
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
    <Select.Root
      value={value}
      onValueChange={(newValue) => {
        // @ts-expect-error
        newValue.length;
      }}
    />
  );
}
