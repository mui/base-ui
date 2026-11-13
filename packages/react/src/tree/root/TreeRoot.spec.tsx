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

// Without `selectionMode`, selection is the single-select scalar shape.
<Tree.Root
  items={[] as FileItem[]}
  onSelectedItemsChange={(selected) => {
    expectType<string | number | null, typeof selected>(selected);
  }}
>
  {list}
</Tree.Root>;

// With `selectionMode="multiple"` it is the array shape (plus the select-all
// sentinel, which is part of the multiple-mode model).
<Tree.Root
  items={[] as FileItem[]}
  selectionMode="multiple"
  onSelectedItemsChange={(selected) => {
    expectType<(string | number)[] | typeof Tree.SELECTION_ALL, typeof selected>(selected);
  }}
>
  {list}
</Tree.Root>;

// Disabling selection preserves either cardinality so a controlled tree can
// switch between `none` and its previous mode without clearing the model.
<Tree.Root
  items={[] as FileItem[]}
  selectionMode="none"
  selectedItems={['a']}
  onSelectedItemsChange={(selected, details) => {
    expectType<
      string | number | null | (string | number)[] | typeof Tree.SELECTION_ALL,
      typeof selected
    >(selected);
    void details;
  }}
>
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
      selectionMode="multiple"
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
// A wrapper typed on the public alias accepts either mode
// ---------------------------------------------------------------------------

// `Props<TItem>` deliberately leaves the mode broad: a wrapper is written once
// and has to accept whatever its own consumer passes through. Narrowing the
// default to `undefined` made this reject `selectionMode="multiple"` outright.
function FileTree(props: Tree.Root.Props<FileItem>) {
  return <Tree.Root {...props} />;
}

<FileTree items={[]}>{list}</FileTree>;
<FileTree items={[]} selectionMode="multiple" selectedItems={['a']}>
  {list}
</FileTree>;
<FileTree items={[]} selectionMode="single" selectedItems="a">
  {list}
</FileTree>;
<FileTree items={[]} selectionMode="none">
  {list}
</FileTree>;

// Narrowing it explicitly still works for a wrapper that wants one mode only.
function MultiFileTree(props: Tree.Root.Props<FileItem, 'multiple'>) {
  return <Tree.Root {...props} />;
}

<MultiFileTree items={[]} selectionMode="multiple" selectedItems={['a']}>
  {list}
</MultiFileTree>;

// @ts-expect-error single selection accepts one item id, not an array.
<FileTree items={[]} selectionMode="single" selectedItems={['a', 'b']}>
  {list}
</FileTree>;

// @ts-expect-error multiple selection accepts an array or Tree.SELECTION_ALL.
<FileTree items={[]} selectionMode="multiple" selectedItems="a">
  {list}
</FileTree>;

<MultiFileTree
  items={[]}
  // @ts-expect-error the narrowed wrapper only accepts its declared mode.
  selectionMode="single"
>
  {list}
</MultiFileTree>;

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
