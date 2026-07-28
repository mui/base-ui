import * as React from 'react';
import {
  Combobox,
  type ComboboxItemCollection,
  type CreateComboboxItemsOptions,
} from '@base-ui/react/combobox';
import { expectType } from '#test-utils';
import { mergeProps } from '../../merge-props';
import { REASONS } from '../../internals/reasons';

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

<Combobox.Root items={objectItems} defaultValue={objectItems[0]}>
  <Combobox.List>
    {(item: (typeof objectItems)[number]) => (
      <Combobox.Item key={item.value}>{item.label}</Combobox.Item>
    )}
  </Combobox.List>
</Combobox.Root>;

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
  onValueChange={(value) => {
    // @ts-expect-error - possibly null
    value.startsWith('a');
    value?.startsWith('a');
  }}
/>;

<Combobox.Root
  items={objectItemsReadonly}
  defaultValue="a"
  onValueChange={(value) => {
    // @ts-expect-error - possibly null
    value.startsWith('a');
    value?.startsWith('a');
  }}
/>;

<Combobox.Root
  items={objectItems}
  value="a"
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
  onOpenChange={(_open, details) => {
    if (details.reason === REASONS.inputPress) {
      expectType<MouseEvent | PointerEvent | TouchEvent | KeyboardEvent, typeof details.event>(
        details.event,
      );
    }
    if (details.reason === REASONS.cancelOpen) {
      expectType<MouseEvent, typeof details.event>(details.event);
    }
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

function CreateItemsApp(props: {
  getValue?: ((item: { id: number; name: string }) => number) | undefined;
}) {
  const userItems = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];
  type UserItem = (typeof userItems)[number];

  const collection = Combobox.createItems(userItems, {
    getValue: (item) => item.id,
    getLabel: (item) => item.name,
  });
  const objectValueCollection = Combobox.createItems(userItems, {
    // @ts-expect-error Explicit projections must return a non-null primitive.
    getValue: (item) => item,
  });
  const symbolValueCollection = Combobox.createItems(userItems, {
    // @ts-expect-error Symbols are not supported as derived values.
    getValue: (item) => Symbol(item.id),
  });
  const labelOnlyCollection = Combobox.createItems(userItems, {
    getLabel: (item) => item.name,
  });
  Combobox.createItems(userItems, {
    // @ts-expect-error A conditional getValue cannot declare a derived value that may not exist.
    getValue: props.getValue,
    getLabel: (item) => item.name,
  });
  // @ts-expect-error An explicit derived value type requires getValue.
  Combobox.createItems<UserItem, number>(userItems, {
    getLabel: (item) => item.name,
  });
  // @ts-expect-error Typed derived-value options require getValue.
  const optionsWithoutGetValue: CreateComboboxItemsOptions<UserItem, number> = {
    getLabel: (item) => item.name,
  };
  void optionsWithoutGetValue;

  // @ts-expect-error Collection data cannot mix groups and ungrouped items.
  Combobox.createItems([{ value: 'Group', items: [userItems[0]] }, userItems[1]], {
    getValue: (item: UserItem) => item.id,
    getLabel: (item: UserItem) => item.name,
  });
  // @ts-expect-error Collection data cannot mix ungrouped items and groups.
  Combobox.createItems([userItems[1], { value: 'Group', items: [userItems[0]] }], {
    getValue: (item: UserItem) => item.id,
    getLabel: (item: UserItem) => item.name,
  });

  // Data that has not loaded yet: the item type comes from the accessors instead.
  const pendingCollection: ComboboxItemCollection<{ id: number }, number> = Combobox.createItems(
    undefined as { id: number }[] | undefined,
    { getValue: (item) => item.id },
  );
  void pendingCollection;

  // @ts-expect-error A collection exposes no data-manipulation methods.
  collection.each;

  // @ts-expect-error Existing collections are passed directly to Root.
  Combobox.createItems(collection);
  void objectValueCollection;
  void symbolValueCollection;

  return (
    <React.Fragment>
      <Combobox.Root
        items={collection}
        filteredItems={userItems}
        defaultValue={1}
        onValueChange={(value) => value?.toFixed()}
      />
      <Combobox.Root
        items={collection}
        // @ts-expect-error Filtered collection items stay in the source item domain.
        filteredItems={[1, 2]}
      />
      <Combobox.Root
        items={labelOnlyCollection}
        defaultValue={userItems[0]}
        onValueChange={(value) => value?.name}
      />
    </React.Fragment>
  );
}

function CollectionVarianceApp() {
  const broadCollection = Combobox.createItems([{ id: 1 }], {
    getValue: (item) => item.id,
  });

  // @ts-expect-error A collection with broader source items cannot be narrowed.
  const narrowCollection: ComboboxItemCollection<{ id: number; name: string }, number> =
    broadCollection;

  return <Combobox.Root items={narrowCollection} />;
}

export function Wrapper<Value, Multiple extends boolean | undefined = false>(
  props: Combobox.Root.Props<Value, Multiple>,
) {
  return <Combobox.Root {...props} />;
}

// A wrapper opts into forwarding a collection by declaring the item type.
export function CollectionWrapper<Value, Multiple extends boolean | undefined, Item>(
  props: Combobox.Root.Props<Value, Multiple, Item>,
) {
  return <Combobox.Root {...props} />;
}

function CollectionInferenceApp() {
  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];
  const teams = [{ value: 'Engineering', items: users }];

  const collection = Combobox.createItems(users, {
    getValue: (item) => item.id,
    getLabel: (item) => item.name,
  });
  const groupedCollection = Combobox.createItems(teams, {
    getValue: (item) => item.id,
    getLabel: (item) => item.name,
  });

  return (
    <React.Fragment>
      {/* The value helpers receive the derived value, not the source item. */}
      <Combobox.Root
        items={collection}
        defaultValue={1}
        itemToStringLabel={(itemValue) => itemValue.toFixed()}
        itemToStringValue={(itemValue) => itemValue.toFixed()}
        isItemEqualToValue={(a, b) => a.toFixed() === b.toFixed()}
        onItemHighlighted={(itemValue) => itemValue?.toFixed()}
      />
      {/* `multiple` lifts the derived value to an array. */}
      <Combobox.Root
        items={collection}
        multiple
        defaultValue={[1, 2]}
        onValueChange={(value) => value.map((itemValue) => itemValue.toFixed())}
      />
      <Combobox.Root
        items={collection}
        multiple
        // @ts-expect-error `multiple` takes an array of derived values.
        defaultValue={1}
      />
      {/* Grouped data resolves to the leaf item type. */}
      <Combobox.Root
        items={groupedCollection}
        defaultValue={1}
        onValueChange={(value) => value?.toFixed()}
        filter={(item, query) => item.name.includes(query)}
      />
    </React.Fragment>
  );
}

function FilterArgumentApp() {
  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];

  const collection = Combobox.createItems(users, {
    getValue: (item) => item.id,
    getLabel: (item) => item.name,
  });

  return (
    <React.Fragment>
      {/* Plain arrays: the filter receives the item, which is also the value. */}
      <Combobox.Root
        items={users}
        defaultValue={users[0]}
        filter={(item, query) => item.name.includes(query)}
      />
      {/* Collections: the filter receives the source item, not the derived value.
          `Item` stays inferable from `filter` itself, as it is for plain arrays, so an
          explicit annotation there widens it rather than failing to check. */}
      <Combobox.Root
        items={collection}
        defaultValue={1}
        filter={(item, query) => item.name.includes(query)}
      />
    </React.Fragment>
  );
}
