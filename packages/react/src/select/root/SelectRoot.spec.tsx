import * as React from 'react';
import { expectType } from '#test-utils';
import { Select } from '@base-ui/react/select';
import { mergeProps } from '../../merge-props';

const objectItems = [
  { value: 'a', label: 'apple' },
  { value: 'b', label: 'banana' },
  { value: 'c', label: 'cherry' },
];

const objectItemsReadonly = [
  { value: 'a', label: 'apple' },
  { value: 'b', label: 'banana' },
  { value: 'c', label: 'cherry' },
] as const;

<Select.Root
  items={objectItemsReadonly}
  defaultValue="a"
  itemToStringLabel={(item) => {
    item.startsWith('a');
    return item;
  }}
  itemToStringValue={(item) => {
    item.startsWith('a');
    return item;
  }}
  onValueChange={(value) => {
    value.startsWith('a');
  }}
/>;

<Select.Root
  items={objectItems}
  defaultValue="a"
  itemToStringLabel={(item) => {
    item.startsWith('a');
    return item;
  }}
  itemToStringValue={(item) => {
    item.startsWith('a');
    return item;
  }}
  onValueChange={(value) => {
    value.startsWith('a');
  }}
/>;

<Select.Root
  items={objectItems}
  value="a"
  itemToStringLabel={(item) => {
    item.startsWith('a');
    return item;
  }}
  itemToStringValue={(item) => {
    item.startsWith('a');
    return item;
  }}
  onValueChange={(value) => {
    value.startsWith('a');
  }}
/>;

type Obj = { code: string };
const objectValueItems: Array<{ value: Obj; label: string }> = [
  { value: { code: 'a' }, label: 'apple' },
  { value: { code: 'b' }, label: 'banana' },
];

<Select.Root
  items={objectValueItems}
  defaultValue={objectValueItems[0].value}
  itemToStringLabel={(item) => item.code}
  itemToStringValue={(item) => item.code}
  onValueChange={(value) => {
    value.code;
  }}
/>;

<Select.Root
  items={objectValueItems}
  value={objectValueItems[0].value}
  itemToStringLabel={(item) => item.code}
  itemToStringValue={(item) => item.code}
  onValueChange={(value) => {
    value.code;
  }}
/>;

<Select.Root
  value="a"
  isItemEqualToValue={(item, value) => {
    expectType<string, typeof item>(item);
    expectType<string, typeof value>(value);
    item.toUpperCase();
    value?.toUpperCase();
    return item === value;
  }}
/>;

<Select.Root
  value={objectValueItems[0]}
  isItemEqualToValue={(item, value) => {
    expectType<(typeof objectValueItems)[number], typeof item>(item);
    expectType<(typeof objectValueItems)[number], typeof value>(value);
    item.value.code;
    value.value.code;
    return value != null && item.value.code === value.value.code;
  }}
/>;

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

<Select.Root
  defaultValue={[{ id: 2, name: 'Bob' }]}
  itemToStringLabel={(item) => item.name}
  itemToStringValue={(item) => String(item.id)}
  isItemEqualToValue={(item, value) => item.id === value.id}
  defaultOpen
  multiple
/>;

// Should accept null value
<Select.Root items={objectItemsReadonly} value={null} />;

<Select.Root
  value="hello"
  onValueChange={(value) => {
    expectType<string, typeof value>(value);
  }}
/>;

function App2() {
  const [value, setValue] = React.useState('a');
  return (
    <Select.Root
      value={value}
      onValueChange={(newValue) => {
        newValue.length;
        setValue(newValue);
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
        // The callback correctly omits null from the type of newValue, even though the `value` is specified as `string | null`.
        // This is because the Select component will never pass null to the onValueChange callback, even if the value can be null.
        expectType<string, typeof newValue>(newValue);
        newValue.length;
        setValue(newValue);
      }}
    />
  );
}

mergeProps<typeof Select.Root<any>>(
  {
    value: '',
  },
  {},
);

export function Wrapper<Value, Multiple extends boolean | undefined = false>(
  props: Select.Root.Props<Value, Multiple>,
) {
  return <Select.Root {...props} />;
}
