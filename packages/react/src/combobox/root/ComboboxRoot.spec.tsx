import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { mergeProps } from '../../merge-props';

const objectItems = [
  { value: 'a', label: 'apple' },
  { value: 'b', label: 'banana' },
  { value: 'c', label: 'cherry' },
];

const mismatchedItems = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
];

const numberItems = [{ value: 1, label: 'one' }];

const objectItemsReadonly = [
  { value: 'a', label: 'apple' },
  { value: 'b', label: 'banana' },
  { value: 'c', label: 'cherry' },
] as const;

const groupItemsReadonly = [
  {
    value: 'fruits',
    items: [
      { value: 'a', label: 'apple' },
      { value: 'b', label: 'banana' },
      { value: 'c', label: 'cherry' },
    ],
  },
  {
    value: 'vegetables',
    items: [
      { value: 'd', label: 'daikon' },
      { value: 'e', label: 'endive' },
      { value: 'f', label: 'fennel' },
    ],
  },
] as const;

const groupNumberItems = [
  {
    value: 'numbers',
    items: [
      { value: 1, label: 'one' },
      { value: 2, label: 'two' },
    ],
  },
] as const;

type OptionData = Record<string, any> | any[] | string | boolean | number | null | undefined;

type Option<TData extends OptionData = any> = {
  value: string | number;
  label: string;
  data?: TData;
};

type GroupedOptions<TData extends OptionData = any> = {
  title?: React.ReactNode;
  items: Option<TData>[];
}[];

const groupedOptions: GroupedOptions = [
  { title: 'Fruits', items: objectItems },
  { title: 'Other', items: objectItems },
];

function acceptsValueMode(_valueMode: Combobox.Root.ValueMode | undefined) {}

acceptsValueMode('item');
acceptsValueMode('value');
acceptsValueMode(undefined);
// @ts-expect-error - unsupported value mode
acceptsValueMode('auto');

<Combobox.Root
  items={objectItems}
  itemToStringValue={(item) => {
    // @ts-expect-error - `item` is unknown without `value`/`defaultValue`
    return item.value;
  }}
/>;

<Combobox.Root
  items={groupItemsReadonly}
  itemToStringValue={(item) => {
    // @ts-expect-error - `item` is unknown without `value`/`defaultValue`
    return item.value;
  }}
/>;

<Combobox.Root
  items={groupItemsReadonly}
  defaultValue={groupItemsReadonly[0].items[0]}
  itemToStringValue={(item) => {
    return item.label;
  }}
/>;

<Combobox.Root
  items={objectItems}
  valueMode="value"
  defaultValue="a"
  onValueChange={(value) => {
    // @ts-expect-error - possibly null
    value.startsWith('a');
    value?.startsWith('a');
  }}
/>;

<Combobox.Root
  // @ts-expect-error - primitive selected values with object items require `valueMode="value"`
  items={objectItems}
  defaultValue="a"
/>;

<Combobox.Root
  // @ts-expect-error - items shape doesn't match string value type
  items={mismatchedItems}
  defaultValue="a"
/>;

<Combobox.Root
  // @ts-expect-error - with `valueMode="value"`, primitive selected values require `{ value, label }` object items
  items={mismatchedItems}
  valueMode="value"
  defaultValue="a"
/>;

<Combobox.Root
  items={objectItemsReadonly}
  valueMode="value"
  defaultValue="a"
  onValueChange={(value) => {
    // @ts-expect-error - possibly null
    value.startsWith('a');
    value?.startsWith('a');
  }}
/>;

<Combobox.Root
  items={objectItems}
  valueMode="value"
  value="a"
  onValueChange={(value) => {
    // @ts-expect-error - possibly null
    value.startsWith('a');
  }}
/>;

<Combobox.Root items={objectItems} valueMode="value" defaultValue="a" />;

<Combobox.Root items={numberItems} valueMode="value" defaultValue={1} />;

<Combobox.Root
  // @ts-expect-error - items shape doesn't match string value type
  items={numberItems}
  defaultValue="1"
/>;

<Combobox.Root items={groupItemsReadonly} valueMode="value" defaultValue="a" />;

<Combobox.Root items={groupNumberItems} valueMode="value" defaultValue={1} />;

<Combobox.Root items={objectItems} valueMode="item" defaultValue={objectItems[0]} />;

<Combobox.Root items={objectItems} valueMode="value" defaultValue="a" />;

<Combobox.Root items={objectItems} valueMode="value" defaultValue={null} />;

<Combobox.Root items={objectItems} valueMode="value" value={null} />;

<Combobox.Root
  // @ts-expect-error - unsupported value mode
  valueMode="auto"
/>;

interface SelectProps<
  Data extends OptionData = any,
  Multiple extends boolean | undefined = false,
> extends Omit<
  Combobox.Root.Props<Option['value'], Multiple>,
  'isItemEqualToValue' | 'valueMode' | 'items' | 'children'
> {
  items: Option<Data>[] | GroupedOptions<Data>;
}

function Select<Data extends OptionData, Multiple extends boolean | undefined = false>({
  items,
  ...rest
}: SelectProps<Data, Multiple>) {
  return <Combobox.Root valueMode="value" items={items} {...rest} />;
}

<Select items={objectItems} />;

<Select items={groupedOptions} />;

<Combobox.Root
  // @ts-expect-error - items shape doesn't match string value type
  items={mismatchedItems}
  value="a"
/>;

<Combobox.Root
  // @ts-expect-error - items shape doesn't match number value type
  items={mismatchedItems}
  defaultValue={1}
/>;

<Combobox.Root
  // @ts-expect-error - items shape doesn't match number value type
  items={groupItemsReadonly}
  defaultValue={1}
/>;

<Combobox.Root
  // @ts-expect-error - items shape doesn't match string value type
  items={groupNumberItems}
  defaultValue="1"
/>;

<Combobox.Root
  items={objectItems}
  value={objectItems[0]}
  onValueChange={(value) => {
    // @ts-expect-error - possibly null
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
  items={objectItems}
  defaultValue={objectItems[0]}
  itemToStringLabel={(item) => {
    // @ts-expect-error
    item.x;
    return item.label;
  }}
  itemToStringValue={(item) => {
    // @ts-expect-error
    item.x;
    return item.value;
  }}
  isItemEqualToValue={(a, b) => {
    // @ts-expect-error
    a.x === b.x;
    return a.value === b.value;
  }}
/>;

<Combobox.Root
  defaultValue="a"
  itemToStringLabel={(item) => {
    return item;
  }}
  itemToStringValue={(item) => {
    return item;
  }}
  isItemEqualToValue={(a, b) => {
    // @ts-expect-error
    a.x === b.x;
    return a === b;
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
  items={['a', 'b', 'c']}
  onValueChange={(value) => {
    // @ts-expect-error
    value.length;
  }}
/>;

<Combobox.Root
  items={['a', 'b', 'c']}
  defaultValue="test"
  onValueChange={(value) => {
    // @ts-expect-error
    value.length;
  }}
/>;

<Combobox.Root items={['a', 'b', 'c']} value="a" />;

<Combobox.Root
  items={['a', 'b', 'c']}
  value="a"
  onValueChange={(value) => {
    // @ts-expect-error - possibly null
    value.toUpperCase();
    value?.toUpperCase();
  }}
/>;

<Combobox.Root items={[1, 2, 3]} defaultValue={2} />;

<Combobox.Root items={[1, 2, 3]} value={2} />;

<Combobox.Root
  items={[1, 2, 3]}
  value={2}
  onValueChange={(value) => {
    // @ts-expect-error - possibly null
    value.toFixed(1);
    value?.toFixed(1);
  }}
/>;

<Combobox.Root
  items={[
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]}
  defaultValue={[{ id: 2, name: 'Bob' }]}
  itemToStringLabel={(item) => item.name}
  itemToStringValue={(item) => String(item.id)}
  isItemEqualToValue={(item, value) => item.id === value.id}
  defaultOpen
  multiple
/>;

// Should accept null value
<Combobox.Root
  items={[
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]}
  value={null}
/>;

function App2() {
  const [value, setValue] = React.useState('a');
  return (
    <Combobox.Root
      value={value}
      onValueChange={(newValue) => {
        // @ts-expect-error
        newValue.length;
        // @ts-expect-error - user is forced to type useState with null
        // even if they don't want to allow null
        setValue(newValue);
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
        setValue(newValue);
      }}
    />
  );
}

mergeProps<typeof Combobox.Root<any>>(
  {
    value: '',
  },
  {},
);

export function Wrapper<Value, Multiple extends boolean | undefined = false>(
  props: Combobox.Root.Props<Value, Multiple>,
) {
  return <Combobox.Root {...props} />;
}

export function WrapperWithValueMode<
  Value,
  Multiple extends boolean | undefined = false,
  ValueMode extends Combobox.Root.ValueMode | undefined = 'item',
>(props: Combobox.Root.Props<Value, Multiple, ValueMode>) {
  return <Combobox.Root {...props} />;
}

<Wrapper items={objectItems} value={objectItems[0]} />;

<WrapperWithValueMode
  valueMode="value"
  items={objectItems}
  value="a"
  onValueChange={(value) => {
    // @ts-expect-error - possibly null
    value.startsWith('a');
    value?.startsWith('a');
  }}
/>;
