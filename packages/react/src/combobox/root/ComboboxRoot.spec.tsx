import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
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

const numberObjectItems = [
  { value: 1, label: 'one' },
  { value: 2, label: 'two' },
  { value: 3, label: 'three' },
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

<Combobox.Root
  items={objectItems}
  itemToStringValue={(item) => {
    // @ts-expect-error - inference always comes from `value`/`defaultValue`
    return item.value;
  }}
/>;

<Combobox.Root
  items={groupItemsReadonly}
  itemToStringValue={(item) => {
    // @ts-expect-error - inference always comes from `value`/`defaultValue`
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
  defaultValue="a"
  getValueFromItem={(item) => item.value}
  onValueChange={(value) => {
    // @ts-expect-error - possibly null
    value.startsWith('a');
    value?.startsWith('a');
  }}
/>;

<Combobox.Root
  items={objectItemsReadonly}
  defaultValue="a"
  getValueFromItem={(item) => item.value}
  onValueChange={(value) => {
    // @ts-expect-error - possibly null
    value.startsWith('a');
    value?.startsWith('a');
  }}
/>;

<Combobox.Root
  items={objectItems}
  value="a"
  getValueFromItem={(item) => item.value}
  onValueChange={(value) => {
    // @ts-expect-error - possibly null
    value.startsWith('a');
  }}
/>;

<Combobox.Root
  items={objectItems}
  value={objectItems[0]}
  onValueChange={(value) => {
    // @ts-expect-error - possibly null
    value.label;
  }}
/>;

// @ts-expect-error - primitive selected values with object items require `getValueFromItem`
<Combobox.Root items={objectItems} defaultValue="a" />;

// @ts-expect-error - primitive selected values with object items require `getValueFromItem`
<Combobox.Root items={objectItems} value="a" />;

// @ts-expect-error - primitive selected values with object items require `getValueFromItem`
<Combobox.Root items={numberObjectItems} defaultValue={1} />;

// @ts-expect-error - primitive selected values with object items require `getValueFromItem`
<Combobox.Root items={numberObjectItems} value={1} />;

<Combobox.Root
  items={objectItems}
  defaultValue="a"
  getValueFromItem={(item) => {
    // @ts-expect-error
    item.nonexistent;
    return item.value;
  }}
  onValueChange={(value) => {
    value?.startsWith('a');
  }}
/>;

<Combobox.Root
  items={objectItemsReadonly}
  value="a"
  getValueFromItem={(item) => item.value}
  onValueChange={(value) => {
    value?.startsWith('a');
  }}
/>;

<Combobox.Root
  items={numberObjectItems}
  defaultValue={1}
  getValueFromItem={(item) => item.value}
  onValueChange={(value) => {
    value?.toFixed(2);
    // @ts-expect-error
    value?.toUpperCase();
  }}
/>;

<Combobox.Root
  items={objectItems}
  defaultValue={['a', 'b']}
  multiple
  getValueFromItem={(item) => item.value}
  onValueChange={(value) => {
    value.pop();
    // @ts-expect-error
    value.startsWith('a');
  }}
/>;

type ObjectItem = (typeof objectItems)[number];

const stringItemToValue: NonNullable<
  Combobox.Root.Props<string, false, readonly ObjectItem[]>['getValueFromItem']
> = (item) => {
  return item.value;
};

// @ts-expect-error - getValueFromItem must return the selected value type
const invalidStringItemToValue: NonNullable<
  Combobox.Root.Props<string, false, readonly ObjectItem[]>['getValueFromItem']
> = (_item) => {
  return 123;
};

<Combobox.Root<string, false, readonly ObjectItem[]>
  items={objectItems}
  defaultValue="a"
  getValueFromItem={stringItemToValue}
/>;

<Combobox.Root
  items={groupItemsReadonly}
  defaultValue="a"
  getValueFromItem={(item) => item.value}
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

interface SelectProps<
  Data extends OptionData = any,
  Multiple extends boolean | undefined = false,
> extends Omit<
  Combobox.Root.Props<Option['value'], Multiple>,
  'isItemEqualToValue' | 'getValueFromItem' | 'items' | 'children'
> {
  items: Option<Data>[] | GroupedOptions<Data>;
}

function Select<Data extends OptionData, Multiple extends boolean | undefined = false>({
  items,
  ...rest
}: SelectProps<Data, Multiple>) {
  return <Combobox.Root items={items} getValueFromItem={(item) => item.value} {...rest} />;
}

<Select items={objectItems} />;

<Select items={groupedOptions} />;

type Primitive = string | number;

type RootGetValueFromItem<Item, Value extends Primitive> = NonNullable<
  Combobox.Root.Props<Value, false, readonly Item[]>['getValueFromItem']
>;

function asRootGetValueFromItem<Item, Value extends Primitive>(
  getItemValue: (item: Item) => Value,
): RootGetValueFromItem<Item, Value> {
  return getItemValue as RootGetValueFromItem<Item, Value>;
}

type ValueObjectComboboxProps<Item, Value extends Primitive> = Omit<
  Combobox.Root.Props<Value, false, readonly Item[]>,
  'items' | 'children' | 'getValueFromItem' | 'itemToStringLabel'
> & {
  items: readonly Item[];
  getItemValue: (item: Item) => Value;
  getItemLabel: (item: Item) => string;
  renderItem?: (item: Item) => React.ReactNode;
};

function ValueObjectCombobox<Item, Value extends Primitive>({
  items,
  getItemValue,
  getItemLabel,
  renderItem,
  ...rootProps
}: ValueObjectComboboxProps<Item, Value>) {
  const rootGetValueFromItem = asRootGetValueFromItem(getItemValue);

  return (
    <Combobox.Root<Value, false, readonly Item[]>
      {...rootProps}
      items={items}
      getValueFromItem={rootGetValueFromItem}
      itemToStringLabel={(value) => {
        const matchingItem = items.find((item) => Object.is(getItemValue(item), value));
        return matchingItem ? getItemLabel(matchingItem) : String(value);
      }}
    >
      <Combobox.Input />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              {(item) => {
                const value = getItemValue(item);
                return (
                  <Combobox.Item key={value} value={value}>
                    {renderItem?.(item) ?? getItemLabel(item)}
                  </Combobox.Item>
                );
              }}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

<ValueObjectCombobox
  items={objectItems}
  getItemValue={(item) => item.value}
  getItemLabel={(item) => item.label}
  defaultValue={objectItems[0].value}
  onValueChange={(value) => {
    value?.startsWith('a');
    // @ts-expect-error - possibly null
    value.startsWith('a');
  }}
/>;

<ValueObjectCombobox
  items={numberObjectItems}
  getItemValue={(item): number => item.value}
  getItemLabel={(item) => item.label}
  value={1}
  onValueChange={(value) => {
    value?.toFixed(1);
    // @ts-expect-error - number value
    value?.startsWith('1');
  }}
/>;

const peopleItems = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
] as const;

<ValueObjectCombobox
  items={peopleItems}
  getItemValue={(item): number => item.id}
  getItemLabel={(item) => item.name}
  defaultValue={1}
  onValueChange={(value) => {
    value?.toFixed(1);
    // @ts-expect-error - number value
    value?.startsWith('1');
  }}
/>;
