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
