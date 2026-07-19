import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { mergeProps } from '../../merge-props';
import type { AriaCombobox } from './AriaCombobox';

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

const disjointGroupItemsReadonly = [
  {
    groupLabel: 'fruits',
    items: [{ id: 'apple', label: 'Apple', fruitOnly: true as const }],
  },
  {
    groupLabel: 'vegetables',
    items: [{ id: 'daikon', label: 'Daikon', vegetableOnly: true as const }],
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
  filteredItems={objectItems}
  itemToValue={(item) => item.value}
  onValueChange={(value) => {
    value?.startsWith('a');
    // @ts-expect-error - mapped values are strings, not source items
    value?.label;
  }}
/>;

const itemsWithOptionalValues: Array<{ value?: string; label: string }> = [{ label: 'No value' }];

<Combobox.Root
  items={itemsWithOptionalValues}
  itemToValue={(item) => item.value}
  onValueChange={(value) => {
    const normalizedValue: string | null = value;
    void normalizedValue;
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

// Legacy compatibility: `items` and `filteredItems` must not participate in `Value` inference
// unless `itemToValue` is present. Every call in this section compiles on master.
type LegacyObjectItem = { id: number; label: string };
type LegacyShape = { kind: 'circle'; radius: number } | { kind: 'square'; sideLength: number };
type LegacyValue<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value;
type LegacySelectionMode<Multiple extends boolean | undefined> = Multiple extends true
  ? 'multiple'
  : 'single';
type LegacyRootContract<Value, Multiple extends boolean | undefined = false> = Omit<
  AriaCombobox.Props<Value, LegacySelectionMode<Multiple>>,
  | 'fillInputOnItemPress'
  | 'autoComplete'
  | 'formAutoComplete'
  | 'submitOnItemClick'
  | 'autoHighlight'
  | 'keepHighlight'
  | 'highlightItemOnHover'
  | 'itemToStringLabel'
  | 'itemToStringValue'
  | 'itemToValue'
  | 'isItemEqualToValue'
  | 'selectionMode'
  | 'defaultSelectedValue'
  | 'selectedValue'
  | 'onSelectedValueChange'
  | 'actionsRef'
  | 'onOpenChange'
  | 'onInputValueChange'
  | 'onItemHighlighted'
> & {
  items?: readonly any[] | undefined;
  filteredItems?: readonly any[] | undefined;
  filter?:
    | null
    | ((item: Value, query: string, itemToString?: (item: Value) => string) => boolean)
    | undefined;
  multiple?: Multiple | undefined;
  defaultValue?: LegacyValue<Value, Multiple> | null | undefined;
  value?: LegacyValue<Value, Multiple> | null | undefined;
  onValueChange?:
    | ((
        value: LegacyValue<Value, Multiple> | (Multiple extends true ? never : null),
        details: Combobox.Root.ChangeEventDetails,
      ) => void)
    | undefined;
  itemToStringLabel?: ((item: Value) => string) | undefined;
  itemToStringValue?: ((item: Value) => string) | undefined;
  isItemEqualToValue?: ((item: Value, value: Value) => boolean) | undefined;
  onItemHighlighted?:
    | ((item: Value | undefined, details: Combobox.Root.HighlightEventDetails) => void)
    | undefined;
};

declare const legacyUnionItems: readonly LegacyObjectItem[] | typeof groupItemsReadonly | undefined;
declare const legacyShape: LegacyShape;
declare function getLegacyShape(): LegacyShape;
declare const setLegacyShape: React.Dispatch<React.SetStateAction<LegacyShape | null>>;
declare const legacyDate: Date;

declare const legacyBrand: unique symbol;
type LegacyBrandedValue = string & { readonly [legacyBrand]: true };
declare const legacyBrandedValue: LegacyBrandedValue;

declare class LegacyClassValue {
  private marker;
  getLabel(): string;
}
declare const legacyClassValue: LegacyClassValue;

enum LegacyEnumValue {
  Apple = 'apple',
  Banana = 'banana',
}

<Combobox.Root<string>
  items={objectItems}
  filteredItems={objectItemsReadonly}
  value="a"
  filter={(item, query, itemToString) => {
    const exactItem: string = item;
    itemToString?.(exactItem);
    return exactItem.includes(query);
  }}
  itemToStringLabel={(item) => {
    const exactItem: string = item;
    return exactItem;
  }}
  itemToStringValue={(item) => {
    const exactItem: string = item;
    return exactItem;
  }}
  isItemEqualToValue={(item, value) => {
    const exactItem: string = item;
    const exactValue: string = value;
    return exactItem === exactValue;
  }}
  onItemHighlighted={(item) => {
    const exactItem: string | undefined = item;
    void exactItem;
  }}
  onValueChange={(value) => {
    const exactValue: string | null = value;
    void exactValue;
  }}
/>;

// Source and selected values may be unrelated in every legacy source configuration.
<Combobox.Root items={[1, 2]} value="wrong" />;
<Combobox.Root items={['right', 2]} value="right" />;
<Combobox.Root filteredItems={objectItems} value="a" />;
<Combobox.Root items={objectItems} filteredItems={[1, 2]} value="a" />;
<Combobox.Root items={objectItemsReadonly} value="a" virtualized />;
<Combobox.Root items={groupItemsReadonly} value="a" filter={(item) => item.startsWith('a')} />;
<Combobox.Root<string> items={legacyUnionItems} value="a" filter={(item) => item.length > 0} />;
<Combobox.Root items={['a', 'b']} value={{ id: 1 }} />;
<Combobox.Root items={objectItems} value={1 as 1 | 2} />;

const readonlyStringItems = ['a', 'b'] as const;

function BroadControlledValue() {
  const [value, setValue] = React.useState<string | null>('a');
  return <Combobox.Root items={readonlyStringItems} value={value} onValueChange={setValue} />;
}

const setNarrowValue: React.Dispatch<React.SetStateAction<'a' | 'b' | null>> = () => {};
<Combobox.Root items={objectItems} value={'a' as 'a' | 'b'} onValueChange={setNarrowValue} />;

const setNarrowMultipleValue: React.Dispatch<React.SetStateAction<Array<'a' | 'b'>>> = () => {};
<Combobox.Root
  items={objectItems}
  multiple
  value={['a'] as Array<'a' | 'b'>}
  onValueChange={setNarrowMultipleValue}
/>;

<Combobox.Root
  items={objectItems}
  value={LegacyEnumValue.Apple}
  onValueChange={(value) => {
    const exactValue: LegacyEnumValue | null = value;
    void exactValue;
  }}
/>;

<Combobox.Root
  items={objectItems}
  value={legacyBrandedValue}
  onValueChange={(value) => {
    const exactValue: LegacyBrandedValue | null = value;
    void exactValue;
  }}
/>;

<Combobox.Root
  items={objectItems}
  value={legacyDate}
  onValueChange={(value) => value?.getTime()}
  isItemEqualToValue={(item, value) => item.getTime() === value.getTime()}
/>;

<Combobox.Root
  items={objectItems}
  value={legacyClassValue}
  onValueChange={(value) => value?.getLabel()}
  isItemEqualToValue={(item, value) => item === value}
/>;

<Combobox.Root<LegacyShape>
  items={objectItems}
  value={legacyShape}
  onValueChange={setLegacyShape}
/>;

<Combobox.Root<string, true>
  items={objectItems}
  multiple
  value={['a']}
  onValueChange={(value) => {
    const exactValue: string[] = value;
    void exactValue;
  }}
/>;

const legacyProps: Combobox.Root.Props<string> = {
  items: objectItems,
  filteredItems: objectItemsReadonly,
  value: 'a',
  filter: (item) => item.length > 0,
};
// @ts-expect-error - the legacy Props alias remains identical to the pre-itemToValue contract
legacyProps.itemToValue;
// @ts-expect-error - React's special key attribute is not a component prop
legacyProps.key;
declare const legacyContractProps: LegacyRootContract<string>;
declare const publicLegacyProps: Combobox.Root.Props<string>;
const publicPropsFromLegacyContract: Combobox.Root.Props<string> = legacyContractProps;
const legacyContractFromPublicProps: LegacyRootContract<string> = publicLegacyProps;
const reflectedLegacyProps: React.ComponentProps<typeof Combobox.Root<string>> = legacyProps;
const parameterLegacyProps: Parameters<typeof Combobox.Root<string>>[0] = legacyProps;
declare const reflectedGenericProps: React.ComponentProps<typeof Combobox.Root>;
declare const parameterGenericProps: Parameters<typeof Combobox.Root>[0];
const publicPropsFromReflectedGeneric: Combobox.Root.Props<unknown, boolean | undefined> =
  reflectedGenericProps;
const publicPropsFromParameterGeneric: Combobox.Root.Props<unknown, boolean | undefined> =
  parameterGenericProps;
const reflectedGenericFromPublicProps: React.ComponentProps<typeof Combobox.Root> =
  publicPropsFromReflectedGeneric;

const legacyMultipleProps: Combobox.Root.Props<string, true> = {
  multiple: true,
  value: ['a'],
};
const reflectedLegacyMultipleProps: React.ComponentProps<typeof Combobox.Root<string, true>> =
  legacyMultipleProps;

<Combobox.Root {...legacyProps} />;
<Combobox.Root {...reflectedLegacyProps} />;
<Combobox.Root {...parameterLegacyProps} />;
<Combobox.Root {...reflectedGenericFromPublicProps} />;
<Combobox.Root {...publicPropsFromLegacyContract} />;
<Combobox.Root {...legacyContractFromPublicProps} />;
<Combobox.Root {...reflectedLegacyMultipleProps} />;

const legacyCallable: <Value, Multiple extends boolean | undefined = false>(
  props: LegacyRootContract<Value, Multiple>,
) => React.JSX.Element = Combobox.Root;
void legacyCallable;

const selectedLiteral = 'a' as const;
<Combobox.Root
  items={['a', 'b']}
  value={selectedLiteral}
  onValueChange={(value) => {
    const narrowValue: 'a' | null = value;
    void narrowValue;
    value?.toUpperCase();
  }}
/>;

<Combobox.Root
  items={[1, 2]}
  value={null}
  onValueChange={(value) => {
    const nullOnly: null = value;
    void nullOnly;
  }}
/>;

// `itemToValue` maps a source item to the emitted value. `Value` is inferred from the getter's
// return, `Item` from `items` and the getter's parameter.
<Combobox.Root
  items={objectItems}
  itemToValue={(item) => {
    return item.value;
  }}
  onValueChange={(value) => {
    // @ts-expect-error - possibly null
    value.startsWith('a');
    value?.startsWith('a');
  }}
  filter={(item, query) => {
    // `filter` receives the source item, not the mapped value.
    return item.label.includes(query);
  }}
  isItemEqualToValue={(a, b) => {
    // The comparator receives the mapped value.
    return a === b;
  }}
/>;

// Whole-object items with a mapped primitive value.
<Combobox.Root
  items={[
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]}
  itemToValue={(item) => item.id}
  defaultValue={2}
  onValueChange={(value) => {
    // @ts-expect-error - possibly null
    value.toFixed();
    value?.toFixed();
  }}
/>;

// Grouped source items with a mapped value.
<Combobox.Root
  items={groupItemsReadonly}
  itemToValue={(item) => item.value}
  onValueChange={(value) => {
    value?.startsWith('a');
  }}
/>;

// Group and leaf keys are intentionally disjoint so this proves callbacks receive leaf items.
<Combobox.Root
  items={disjointGroupItemsReadonly}
  itemToValue={(item) => item.id}
  filter={(item, query) => item.label.includes(query)}
  onValueChange={(value) => value?.toUpperCase()}
/>;

<Combobox.Root
  filteredItems={disjointGroupItemsReadonly}
  itemToValue={(item) => item.id}
  filter={(item, query) => item.label.includes(query)}
/>;

const mappedLiteralItems = [
  { id: 'a' as const, label: 'Apple' },
  { id: 'b' as const, label: 'Banana' },
] as const;

<Combobox.Root
  items={mappedLiteralItems}
  itemToValue={(item) => item.id}
  value={'a' as 'a' | 'b'}
  onValueChange={setNarrowValue}
/>;

<Combobox.Root
  items={mappedLiteralItems}
  itemToValue={(item) => item.id}
  multiple
  value={['a'] as Array<'a' | 'b'>}
  onValueChange={setNarrowMultipleValue}
/>;

const mappedComplexItems = [
  { value: legacyDate, label: 'Date' },
  { value: legacyDate, label: 'Other date' },
];

<Combobox.Root
  items={mappedComplexItems}
  itemToValue={(item) => item.value}
  value={legacyDate}
  onValueChange={(value) => value?.getTime()}
  isItemEqualToValue={(item, value) => item.getTime() === value.getTime()}
/>;

const mappedShapeItems: Array<{ value: LegacyShape; label: string }> = [
  { value: legacyShape, label: 'Shape' },
];
const mapLegacyShape = (item: (typeof mappedShapeItems)[number]): LegacyShape => item.value;

<Combobox.Root
  items={mappedShapeItems}
  itemToValue={mapLegacyShape}
  value={getLegacyShape()}
  onValueChange={setLegacyShape}
/>;

export function Wrapper<Value, Multiple extends boolean | undefined = false>(
  props: Combobox.Root.Props<Value, Multiple>,
) {
  return <Combobox.Root {...props} />;
}

const mappedWrapperProps: Combobox.Root.MappedProps<string, false, typeof objectItems> = {
  items: objectItems,
  itemToValue: (item) => item.value,
};
<Combobox.Root {...mappedWrapperProps} />;
