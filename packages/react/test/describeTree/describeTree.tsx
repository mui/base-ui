import * as React from 'react';
import { createRenderer, type BaseUIRenderResult } from '../createRenderer';
import { Tree } from '../../src/tree';
import type { TreeItemModel, TreeRootActions } from '../../src/tree/store/types';

export interface DescribeTreeItem {
  id: string;
  label?: string;
  disabled?: boolean;
  children?: readonly DescribeTreeItem[];
}

export interface DescribeTreeRendererUtils {
  getRoot: () => HTMLElement;
  getAllTreeItemIds: () => string[];
  getFocusedItemId: () => string | null;
  getItemRoot: (id: string) => HTMLElement;
  getItemExpansionTrigger: (id: string) => HTMLElement | null;
  getItemLabel: (id: string) => HTMLElement | null;
  getItemLabelInput: (id: string) => HTMLInputElement | null;
  isItemExpanded: (id: string) => boolean;
  isItemSelected: (id: string) => boolean;
  getSelectedTreeItems: () => string[];
}

export interface DescribeTreeRendererReturnValue extends DescribeTreeRendererUtils {
  actionsRef: React.RefObject<TreeRootActions | null>;
  setProps: (props: object) => Promise<void>;
  setItems: (items: readonly DescribeTreeItem[]) => Promise<void>;
}

export type DescribeTreeRenderer = (params: {
  items: readonly DescribeTreeItem[];
  checkboxSelection?: boolean;
  [key: string]: any;
}) => Promise<DescribeTreeRendererReturnValue>;

function getUtils(result: BaseUIRenderResult): DescribeTreeRendererUtils {
  const getRoot = () => {
    const root = result.container.querySelector('[role="tree"]');
    if (!root) {
      throw new Error('Could not find tree root');
    }
    return root as HTMLElement;
  };

  const getAllTreeItemIds = () =>
    Array.from(result.container.querySelectorAll('[role="treeitem"]')).map(
      (item) => (item as HTMLElement).dataset.itemId!,
    );

  const getFocusedItemId = () => {
    // First check for an item with the data-focused attribute (set by the store)
    const focusedItem = result.container.querySelector('[role="treeitem"][data-focused]');
    if (focusedItem) {
      return (focusedItem as HTMLElement).dataset.itemId!;
    }
    // Fall back to document.activeElement
    const activeElement = document.activeElement;
    if (!activeElement || activeElement.getAttribute('role') !== 'treeitem') {
      return null;
    }
    return (activeElement as HTMLElement).dataset.itemId!;
  };

  const getItemRoot = (id: string) => {
    const item = result.container.querySelector(`[data-item-id="${id}"]`);
    if (!item) {
      throw new Error(`Could not find item with id "${id}"`);
    }
    return item as HTMLElement;
  };

  const getItemExpansionTrigger = (id: string): HTMLElement | null => {
    const item = getItemRoot(id);
    return item.querySelector<HTMLElement>('button');
  };

  const getItemLabel = (id: string): HTMLElement | null => {
    const item = getItemRoot(id);
    return item.querySelector<HTMLElement>('span');
  };

  const getItemLabelInput = (id: string): HTMLInputElement | null => {
    const item = getItemRoot(id);
    return item.querySelector<HTMLInputElement>('input:not([type="checkbox"])');
  };

  const isItemExpanded = (id: string) => getItemRoot(id).getAttribute('aria-expanded') === 'true';

  const isItemSelected = (id: string) => {
    const item = getItemRoot(id);
    // Tree.CheckboxItem uses aria-checked, Tree.Item uses aria-selected
    return (
      item.getAttribute('aria-checked') === 'true' ||
      item.getAttribute('aria-selected') === 'true'
    );
  };

  const getSelectedTreeItems = () =>
    Array.from(result.container.querySelectorAll('[role="treeitem"]'))
      .filter(
        (item) =>
          item.getAttribute('aria-checked') === 'true' ||
          item.getAttribute('aria-selected') === 'true',
      )
      .map((item) => (item as HTMLElement).dataset.itemId!);

  return {
    getRoot,
    getAllTreeItemIds,
    getFocusedItemId,
    getItemRoot,
    getItemExpansionTrigger,
    getItemLabel,
    getItemLabelInput,
    isItemExpanded,
    isItemSelected,
    getSelectedTreeItems,
  };
}

export function describeTree(
  message: string,
  testRunner: (params: { render: DescribeTreeRenderer }) => void,
) {
  const { render: baseRender } = createRenderer();

  describe(message, () => {
    const treeRender: DescribeTreeRenderer = async ({
      items: rawItems,
      checkboxSelection,
      getItemChildren: customGetItemChildren,
      ...other
    }) => {
      const items = rawItems as readonly DescribeTreeItem[];
      const actionsRef =
        React.createRef<TreeRootActions | null>() as React.RefObject<TreeRootActions | null>;

      const convertItems = (describeItems: readonly DescribeTreeItem[]): TreeItemModel[] =>
        describeItems.map((item) => ({
          id: item.id,
          label: item.label ?? item.id,
          ...(item.children ? { children: convertItems(item.children) } : {}),
        }));

      // When a custom getItemChildren is provided, pass items as-is
      const treeItems = customGetItemChildren ? (items as any) : convertItems(items);

      const isItemDisabled = (item: TreeItemModel): boolean => {
        const describeItem = findDescribeItem(items, item.id);
        return describeItem?.disabled ?? false;
      };

      const getItemId = (item: TreeItemModel) => item.id;

      const element = (
        <Tree.Root
          items={treeItems}
          actionsRef={actionsRef}
          isItemDisabled={isItemDisabled}
          getItemId={getItemId}
          {...(customGetItemChildren ? { getItemChildren: customGetItemChildren } : {})}
          {...other}
        >
          {(item: TreeItemModel) =>
            checkboxSelection ? (
              <Tree.CheckboxItem key={item.id}>
                <Tree.CheckboxItemIndicator />
                <Tree.ItemExpansionTrigger />
                <Tree.ItemLabel />
              </Tree.CheckboxItem>
            ) : (
              <Tree.Item key={item.id}>
                <Tree.ItemExpansionTrigger />
                <Tree.ItemLabel />
              </Tree.Item>
            )
          }
        </Tree.Root>
      );

      const result = await baseRender(element);

      return {
        actionsRef,
        setProps: result.setProps,
        setItems: async (newItems: readonly DescribeTreeItem[]) => {
          await result.setProps({
            items: customGetItemChildren ? (newItems as any) : convertItems(newItems),
          });
        },
        ...getUtils(result),
      };
    };

    testRunner({ render: treeRender });
  });
}

function findDescribeItem(
  items: readonly DescribeTreeItem[],
  id: string,
): DescribeTreeItem | undefined {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    if (item.children) {
      const found = findDescribeItem(item.children, id);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}
