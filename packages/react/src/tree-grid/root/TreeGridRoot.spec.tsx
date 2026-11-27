import { expectType } from '#test-utils';
import { TreeGrid } from '..';

const table = <TreeGrid.Table aria-label="Files">{() => null}</TreeGrid.Table>;

<TreeGrid.Root
  items={[]}
  multiple
  onSelectedItemsChange={(selected) => {
    expectType<(string | number)[], typeof selected>(selected);
  }}
>
  {table}
</TreeGrid.Root>;

// With `multiple`, `null` selects nothing, and the handler still receives an array.
<TreeGrid.Root
  items={[]}
  multiple
  selectedItems={null}
  onSelectedItemsChange={(selected) => {
    expectType<(string | number)[], typeof selected>(selected);
  }}
>
  {table}
</TreeGrid.Root>;

<TreeGrid.Root items={[]} multiple="opt-in" defaultSelectedItems={null}>
  {table}
</TreeGrid.Root>;

// A dynamic boolean accepts either selection shape, and handlers stay contextually typed.
function DynamicMultipleTreeGrid(props: {
  multiple: boolean;
  selectedItems: TreeGrid.ItemId[] | TreeGrid.ItemId | null;
}) {
  return (
    <TreeGrid.Root
      items={[]}
      multiple={props.multiple}
      selectedItems={props.selectedItems}
      onSelectedItemsChange={(selected) => {
        expectType<(string | number)[] | string | number | null, typeof selected>(selected);
      }}
    >
      {table}
    </TreeGrid.Root>
  );
}
void DynamicMultipleTreeGrid;

// An optional boolean forwarded by a wrapper behaves the same.
function OptionalMultipleTreeGrid(props: {
  multiple?: boolean;
  selectedItems: TreeGrid.ItemId[] | TreeGrid.ItemId | null;
}) {
  return (
    <TreeGrid.Root
      items={[]}
      multiple={props.multiple}
      selectedItems={props.selectedItems}
      onSelectedItemsChange={(selected) => {
        expectType<(string | number)[] | string | number | null, typeof selected>(selected);
      }}
    >
      {table}
    </TreeGrid.Root>
  );
}
void OptionalMultipleTreeGrid;

// So does a value that switches between single and opt-in selection.
function OptInOrSingleTreeGrid(props: {
  enabled: boolean;
  selectedItems: TreeGrid.ItemId[] | TreeGrid.ItemId | null;
}) {
  return (
    <TreeGrid.Root
      items={[]}
      multiple={props.enabled ? 'opt-in' : false}
      selectedItems={props.selectedItems}
      onSelectedItemsChange={(selected) => {
        expectType<(string | number)[] | string | number | null, typeof selected>(selected);
      }}
    >
      {table}
    </TreeGrid.Root>
  );
}
void OptInOrSingleTreeGrid;

// The root and the table render without children.
<TreeGrid.Root items={[]} />;

<TreeGrid.Root items={[]}>
  <TreeGrid.Table aria-label="Files" />
</TreeGrid.Root>;
