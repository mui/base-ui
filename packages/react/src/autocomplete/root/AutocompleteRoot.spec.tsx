import * as React from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';

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

<Autocomplete.Root
  items={objectItems}
  itemToStringValue={(item) => {
    return item.value;
  }}
/>;

<Autocomplete.Root
  items={groupItemsReadonly}
  itemToStringValue={(item) => {
    return item.label;
  }}
/>;

<Autocomplete.Root
  items={groupItemsReadonly}
  itemToStringValue={(item) => {
    // @ts-expect-error - item is the nested item from groups, not the group itself
    return item.items;
  }}
/>;

<Autocomplete.Root
  items={objectItems}
  defaultValue="a"
  onValueChange={(value) => {
    value.startsWith('a');
  }}
/>;

<Autocomplete.Root
  items={objectItemsReadonly}
  defaultValue="a"
  onValueChange={(value) => {
    value.startsWith('a');
  }}
/>;

<Autocomplete.Root
  items={objectItems}
  value="a"
  onValueChange={(value) => {
    value.startsWith('a');
  }}
/>;

// @ts-expect-error value refers to the input value, not the item object
<Autocomplete.Root items={objectItems} value={objectItems[0]} />;

<Autocomplete.Root
  items={objectItems}
  defaultValue="a"
  itemToStringValue={(item) => {
    return item.value;
  }}
/>;

<Autocomplete.Root
  defaultValue="javascript"
  onValueChange={(value) => {
    // @ts-expect-error
    value.pop();
  }}
/>;

<Autocomplete.Root
  defaultValue="test"
  onValueChange={(value) => {
    value.length;
  }}
/>;

function App2() {
  const [value, setValue] = React.useState('a');
  return (
    <Autocomplete.Root
      value={value}
      onValueChange={(newValue) => {
        newValue.length;
      }}
    />
  );
}

function CollectionInferenceApp() {
  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];
  const teams = [{ value: 'Engineering', items: users }];

  const collection = Autocomplete.useItems(users, {
    value: (item) => item.id,
    label: (item) => item.name,
  });
  const groupedCollection = Autocomplete.useItems(teams, {
    value: (item) => item.id,
    label: (item) => item.name,
  });

  // @ts-expect-error A collection exposes no data-manipulation methods.
  collection.each;

  return (
    <React.Fragment>
      {/* The filter receives the source item, while the value helpers receive the value.
          `Item` stays inferable from `filter` itself, as it is for plain arrays, so an
          explicit annotation there widens it rather than failing to check. */}
      <Autocomplete.Root
        items={collection}
        filter={(item, query) => item.name.includes(query)}
        onItemHighlighted={(itemValue) => itemValue?.toFixed()}
      />
      {/* Grouped data resolves to the leaf item type. */}
      <Autocomplete.Root
        items={groupedCollection}
        filter={(item, query) => item.name.includes(query)}
      />
      {/* Plain arrays are unaffected: the filter receives the item, which is the value. */}
      <Autocomplete.Root items={objectItems} filter={(item, query) => item.label.includes(query)} />
    </React.Fragment>
  );
}
