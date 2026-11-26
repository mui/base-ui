import * as React from 'react';
import { expectType } from '#test-utils';
import { Tree } from '..';

interface FileItem {
  id: string;
  label: string;
  size: number;
  children?: FileItem[];
}

const list = <Tree.List>{() => null}</Tree.List>;

// ---------------------------------------------------------------------------
// Direct use keeps the narrow inference
// ---------------------------------------------------------------------------

// Without `multiple`, selection is the single-select scalar shape.
<Tree.Root
  items={[] as FileItem[]}
  onSelectedItemsChange={(selected) => {
    expectType<string | number | null, typeof selected>(selected);
  }}
>
  {list}
</Tree.Root>;

// With `multiple` it is the array shape (plus the select-all sentinel, which is
// part of the multiple-selection model), whether items toggle or opt in.
<Tree.Root
  items={[] as FileItem[]}
  multiple
  onSelectedItemsChange={(selected) => {
    expectType<(string | number)[] | typeof Tree.SELECTION_ALL, typeof selected>(selected);
  }}
>
  {list}
</Tree.Root>;

<Tree.Root
  items={[] as FileItem[]}
  multiple="opt-in"
  onSelectedItemsChange={(selected) => {
    expectType<(string | number)[] | typeof Tree.SELECTION_ALL, typeof selected>(selected);
  }}
>
  {list}
</Tree.Root>;

// A dynamic boolean accepts either selection shape, and handlers stay contextually typed.
function DynamicMultipleTree(props: {
  multiple: boolean;
  selectedItems: Tree.ItemId[] | typeof Tree.SELECTION_ALL | Tree.ItemId | null;
}) {
  return (
    <Tree.Root
      items={[] as FileItem[]}
      multiple={props.multiple}
      selectedItems={props.selectedItems}
      onSelectedItemsChange={(selected) => {
        expectType<
          (string | number)[] | typeof Tree.SELECTION_ALL | string | number | null,
          typeof selected
        >(selected);
      }}
    >
      {list}
    </Tree.Root>
  );
}
void DynamicMultipleTree;

// An optional boolean forwarded by a wrapper behaves the same.
function OptionalMultipleTree(props: {
  multiple?: boolean;
  selectedItems: Tree.ItemId[] | typeof Tree.SELECTION_ALL | Tree.ItemId | null;
}) {
  return (
    <Tree.Root
      items={[] as FileItem[]}
      multiple={props.multiple}
      selectedItems={props.selectedItems}
      onSelectedItemsChange={(selected) => {
        expectType<
          (string | number)[] | typeof Tree.SELECTION_ALL | string | number | null,
          typeof selected
        >(selected);
      }}
    >
      {list}
    </Tree.Root>
  );
}
void OptionalMultipleTree;

// So does a value that switches between single and opt-in selection.
function OptInOrSingleTree(props: {
  enabled: boolean;
  selectedItems: Tree.ItemId[] | typeof Tree.SELECTION_ALL | Tree.ItemId | null;
}) {
  return (
    <Tree.Root
      items={[]}
      multiple={props.enabled ? 'opt-in' : false}
      selectedItems={props.selectedItems}
      onSelectedItemsChange={(selected) => {
        expectType<
          (string | number)[] | typeof Tree.SELECTION_ALL | string | number | null,
          typeof selected
        >(selected);
      }}
    >
      {list}
    </Tree.Root>
  );
}
void OptInOrSingleTree;

// @ts-expect-error There's no mode without selection.
<Tree.Root items={[] as FileItem[]} multiple="none">
  {list}
</Tree.Root>;

// The handlers receive mutable arrays, so a `useState` setter can be passed as is.
function StateSetterHandlers() {
  const [expandedItems, setExpandedItems] = React.useState<Tree.ItemId[]>([]);
  const [selectedItems, setSelectedItems] = React.useState<
    Tree.ItemId[] | typeof Tree.SELECTION_ALL
  >([]);
  return (
    <Tree.Root
      items={[] as FileItem[]}
      multiple="opt-in"
      expandedItems={expandedItems}
      onExpandedItemsChange={setExpandedItems}
      selectedItems={selectedItems}
      onSelectedItemsChange={setSelectedItems}
    >
      {list}
    </Tree.Root>
  );
}
void StateSetterHandlers;

// The item model flows into collection accessors and render callbacks.
const fileCollection = Tree.createItems([] as FileItem[], {
  getId: (item) => {
    expectType<FileItem, typeof item>(item);
    return item.id;
  },
  getLabel: (item) => item.label,
  getChildren: (item) => item.children,
});

<Tree.Root items={fileCollection}>{list}</Tree.Root>;

interface CustomItem {
  key: number;
  name: string;
  nodes?: CustomItem[];
}

const customItems: CustomItem[] = [];
const customCollection: Tree.ItemCollection<CustomItem> = Tree.createItems(customItems, {
  getId: (item) => item.key,
  getLabel: (item) => item.name,
  getChildren: (item) => item.nodes,
  setChildren: (item, children) => ({ ...item, nodes: [...children] }),
});

// @ts-expect-error Collections are opaque and expose no data methods.
customCollection.data;

<Tree.Root
  items={customCollection}
  onItemsChange={(items) => {
    expectType<CustomItem[], typeof items>(items);
  }}
>
  <Tree.List<CustomItem>>{(item) => item.name}</Tree.List>
</Tree.Root>;

// @ts-expect-error Arbitrary custom models must be wrapped with Tree.createItems().
<Tree.Root items={customItems}>{list}</Tree.Root>;

Tree.createItems(customItems, {
  // @ts-expect-error Tree IDs must be strings or numbers.
  getId: () => Symbol('item'),
  getLabel: (item) => item.name,
});

// @ts-expect-error getLabel is required.
Tree.createItems(customItems, { getId: (item) => item.key });

// @ts-expect-error getId is required.
Tree.createItems(customItems, { getLabel: (item) => item.name });

const deeplyReadonlyStandardItems = [
  { id: 'parent', label: 'Parent', disabled: true, children: [{ id: 'child', label: 'Child' }] },
] as const;
<Tree.Root items={deeplyReadonlyStandardItems}>{list}</Tree.Root>;
const standardItemWithDisabled: Tree.DefaultItem = {
  id: 'disabled',
  label: 'Disabled',
  disabled: true,
};
void standardItemWithDisabled;

// @ts-expect-error Root item accessors were replaced by Tree.createItems().
<Tree.Root items={[] as FileItem[]} itemToId={(item: FileItem) => item.id}>
  {list}
</Tree.Root>;

const removedRootAccessors = {
  itemToStringLabel: (item: FileItem) => item.label,
  itemToChildren: (item: FileItem) => item.children,
  setItemChildren: (item: FileItem, children: readonly FileItem[]) => ({
    ...item,
    children: [...children],
  }),
  isItemDisabled: () => false,
  isItemSelectionDisabled: () => false,
  setItemLabel: (item: FileItem) => item,
};

type AssertNever<Value extends never> = Value;
type RemovedRootAccessorKeys = AssertNever<
  Extract<keyof Tree.Root.Props<FileItem>, keyof typeof removedRootAccessors>
>;
void (null! as RemovedRootAccessorKeys);

// ---------------------------------------------------------------------------
// Wrappers pass the modes they accept as the type argument
// ---------------------------------------------------------------------------

// As with `Select.Root.Props`, the alias defaults to single selection.
function FileTree(props: Tree.Root.Props<FileItem>) {
  return <Tree.Root {...props} />;
}

<FileTree items={[]} selectedItems="a">
  {list}
</FileTree>;

// @ts-expect-error the default alias only accepts single selection.
<FileTree items={[]} multiple>
  {list}
</FileTree>;

// @ts-expect-error single selection accepts one item id, not an array.
<FileTree items={[]} selectedItems={['a', 'b']}>
  {list}
</FileTree>;

function AnyModeFileTree(props: Tree.Root.Props<FileItem, boolean | 'opt-in'>) {
  return <Tree.Root {...props} />;
}

<AnyModeFileTree items={[]} multiple="opt-in" selectedItems={['a']}>
  {list}
</AnyModeFileTree>;
<AnyModeFileTree items={[]} multiple={false} selectedItems="a">
  {list}
</AnyModeFileTree>;

function OptInFileTree(props: Tree.Root.Props<FileItem, 'opt-in'>) {
  return <Tree.Root {...props} />;
}

<OptInFileTree items={[]} multiple="opt-in" selectedItems={['a']}>
  {list}
</OptInFileTree>;

<OptInFileTree
  items={[]}
  // @ts-expect-error the narrowed wrapper only accepts its declared mode.
  multiple={false}
>
  {list}
</OptInFileTree>;

// @ts-expect-error multiple selection accepts an array or Tree.SELECTION_ALL.
<Tree.Root items={[] as FileItem[]} multiple="opt-in" selectedItems="a">
  {list}
</Tree.Root>;

// ---------------------------------------------------------------------------
// Parts infer the item type from their own props, or type the item as `any`
// ---------------------------------------------------------------------------

const customActionsRef = React.createRef<Tree.Root.Actions<CustomItem> | null>();
<Tree.Root items={customCollection} actionsRef={customActionsRef}>
  <Tree.List<CustomItem>>{(item) => item.name}</Tree.List>
</Tree.Root>;

// Item renderers expose the model passed as a type argument.
<Tree.Root items={[] as FileItem[]}>
  <Tree.List<FileItem>>
    {(item) => {
      expectType<FileItem, typeof item>(item);
      return item.size;
    }}
  </Tree.List>
</Tree.Root>;

// Without one, the item is `any`, like `Combobox.List`'s: the list can't see the root's items.
<Tree.Root items={[] as FileItem[]}>
  <Tree.List>
    {(item) => {
      expectType<any, typeof item>(item);
      return item.size;
    }}
  </Tree.List>
</Tree.Root>;
