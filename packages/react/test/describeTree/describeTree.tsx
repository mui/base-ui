import * as React from 'react';
import { act } from '@mui/internal-test-utils';
import { activeElement } from '@base-ui/utils/shadowDom';
import { ownerDocument } from '@base-ui/utils/owner';
import { createRenderer } from '../createRenderer';
import type { BaseUIRenderResult } from '../createRenderer';
import { Tree } from '../../src/tree';
import type { TreeDefaultItem, TreeItemId, TreeRootActions } from '../../src/tree/store/types';

export interface DescribeTreeItem {
  id: TreeItemId;
  label?: string;
  disabled?: boolean;
  children?: readonly DescribeTreeItem[];
}

export interface DescribeTreeRendererUtils {
  getRoot: () => HTMLElement;
  getAllTreeItemIds: () => string[];
  getFocusedItemId: () => string | null;
  getItemRoot: (id: TreeItemId) => HTMLElement;
  getItemExpansionTrigger: (id: TreeItemId) => HTMLElement | null;
  getItemText: (id: TreeItemId) => HTMLElement | null;
  isItemExpanded: (id: TreeItemId) => boolean;
  isItemSelected: (id: TreeItemId) => boolean;
  getSelectedTreeItems: () => string[];
}

export interface DescribeTreeRendererReturnValue extends DescribeTreeRendererUtils {
  actionsRef: React.RefObject<TreeRootActions | null>;
  setProps: (props: object) => Promise<void>;
  setItems: (items: readonly DescribeTreeItem[]) => Promise<void>;
}

/**
 * Renders the tree. `filterValue`, `filter`, `filteredItems`, and `filterMode`
 * wrap it in a controlled `Tree.FilterProvider` (as `value`, `filter`,
 * `filteredItems`, and `mode`) when any of them is passed to the first render.
 */
export type DescribeTreeRenderer = (params: {
  items: readonly DescribeTreeItem[];
  checkboxSelection?: boolean;
  [key: string]: any;
}) => Promise<DescribeTreeRendererReturnValue>;

const FILTER_PROPS = ['filterValue', 'filter', 'filteredItems', 'filterMode'];

function getUtils(result: BaseUIRenderResult): DescribeTreeRendererUtils {
  const getRoot = () => {
    const root = result.container.querySelector('[role="treegrid"]');
    if (!root) {
      throw new Error('Could not find tree root');
    }
    return root as HTMLElement;
  };

  const getAllTreeItemIds = () =>
    Array.from(result.container.querySelectorAll('[role="row"]')).map(
      (item) => (item as HTMLElement).dataset.itemId!,
    );

  /**
   * The item that really holds DOM focus.
   *
   * Deliberately *not* read from `data-focused`: that is store state, and
   * resolving it first let a bug that moves the store without moving focus pass
   * every suite built on this helper.
   */
  const getFocusedItemId = () => {
    const active = activeElement(ownerDocument(result.container));
    if (!active || active.getAttribute('role') !== 'row') {
      return null;
    }
    return (active as HTMLElement).dataset.itemId ?? null;
  };

  const getItemRoot = (id: TreeItemId) => {
    const item = result.container.querySelector(`[data-item-id="${CSS.escape(String(id))}"]`);
    if (!item) {
      throw new Error(`Could not find item with id "${id}"`);
    }
    return item as HTMLElement;
  };

  const getItemExpansionTrigger = (id: TreeItemId): HTMLElement | null => {
    const item = getItemRoot(id);
    return item.querySelector<HTMLElement>('button');
  };

  const getItemText = (id: TreeItemId): HTMLElement | null => {
    const item = getItemRoot(id);
    return item.querySelector<HTMLElement>('[data-testid=text]');
  };

  const isItemExpanded = (id: TreeItemId) =>
    getItemRoot(id).getAttribute('aria-expanded') === 'true';

  const isItemSelected = (id: TreeItemId) =>
    getItemRoot(id).getAttribute('aria-selected') === 'true';

  const getSelectedTreeItems = () =>
    Array.from(result.container.querySelectorAll('[role="row"][aria-selected="true"]')).map(
      (item) => (item as HTMLElement).dataset.itemId!,
    );

  return {
    getRoot,
    getAllTreeItemIds,
    getFocusedItemId,
    getItemRoot,
    getItemExpansionTrigger,
    getItemText,
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

  /**
   * A `Tree.Root` wired up the way a real controlled consumer is: it renders the
   * `items` it is given, and feeds every reported change straight back in.
   *
   * The harness has to do this because `items` is a controlled prop — a tree that
   * is handed `items` and no `onItemsChange` deliberately refuses to change itself,
   * which would make every mutation test here silently assert nothing. `setItems`
   * (i.e. `setProps`) still drives the tree from the outside, and wins.
   */
  function FilterableTreeRoot(props: any) {
    const { filterValue, filter, filteredItems, filterMode, ...other } = props;
    // Decided once: adding the provider later would remount the tree.
    const [filterable] = React.useState(() => FILTER_PROPS.some((key) => key in props));
    const root = <ControlledTreeRoot {...other} />;
    if (!filterable) {
      return root;
    }
    return (
      <Tree.FilterProvider
        value={filterValue ?? ''}
        filter={filter}
        filteredItems={filteredItems}
        mode={filterMode}
      >
        {root}
      </Tree.FilterProvider>
    );
  }

  function ControlledTreeRoot(props: any) {
    const { items: itemsProp, onItemsChange, uncontrolled, collectionOptions, ...other } = props;
    const [items, setItems] = React.useState(itemsProp);

    React.useEffect(() => {
      setItems(itemsProp);
    }, [itemsProp]);

    const handleItemsChange = React.useCallback(
      (nextItems: any, details: any) => {
        setItems(nextItems);
        onItemsChange?.(nextItems, details);
      },
      [onItemsChange],
    );

    const treeItems = React.useMemo(
      () => (collectionOptions ? Tree.createItems(items, collectionOptions) : items),
      [items, collectionOptions],
    );

    // `uncontrolled: true` renders `defaultItems` instead, so a test can exercise
    // the path where the tree owns the model and applies its own incremental
    // lookup updates — the controlled round-trip rebuilds them wholesale and would
    // hide anything wrong with those updates.
    if (uncontrolled) {
      const defaultTreeItems = collectionOptions
        ? Tree.createItems(itemsProp, collectionOptions)
        : itemsProp;
      return <Tree.Root defaultItems={defaultTreeItems} onItemsChange={onItemsChange} {...other} />;
    }

    return <Tree.Root items={treeItems} onItemsChange={handleItemsChange} {...other} />;
  }

  describe(message, () => {
    const treeRender: DescribeTreeRenderer = async ({
      items: rawItems,
      checkboxSelection,
      itemToChildren: customItemToChildren,
      itemToStringLabel: customItemToStringLabel,
      itemToId: customItemToId,
      setItemChildren: customSetItemChildren,
      isItemDisabled: customIsItemDisabled,
      setItemDisabled: customSetItemDisabled,
      isItemSelectionDisabled: customIsItemSelectionDisabled,
      ...other
    }) => {
      const items = rawItems as readonly DescribeTreeItem[];
      const actionsRef =
        React.createRef<TreeRootActions | null>() as React.RefObject<TreeRootActions | null>;

      const convertItems = (describeItems: readonly DescribeTreeItem[]): TreeDefaultItem[] =>
        describeItems.map((item) => ({
          id: item.id,
          label: item.label ?? String(item.id),
          disabled: item.disabled,
          ...(item.children ? { children: convertItems(item.children) } : {}),
        }));

      // When a custom getItemChildren is provided, pass items as-is
      const treeItems = customItemToChildren ? (items as any) : convertItems(items);

      const usesCustomItemModel = [
        customItemToChildren,
        customItemToStringLabel,
        customItemToId,
        customSetItemChildren,
        customIsItemDisabled,
        customSetItemDisabled,
        customIsItemSelectionDisabled,
      ].some((accessor) => accessor !== undefined);
      const collectionOptions = usesCustomItemModel
        ? {
            getId: customItemToId ?? ((item: any) => item.id),
            getLabel: customItemToStringLabel ?? ((item: any) => item.label ?? String(item.id)),
            getChildren: customItemToChildren ?? ((item: any) => item.children),
            setChildren:
              customSetItemChildren ?? ((item: any, children: any) => ({ ...item, children })),
            isDisabled: customIsItemDisabled ?? ((item: any) => item.disabled ?? false),
            setDisabled:
              customSetItemDisabled ?? ((item: any, disabled: boolean) => ({ ...item, disabled })),
            isSelectionDisabled: customIsItemSelectionDisabled,
          }
        : undefined;

      const element = (
        <FilterableTreeRoot
          items={treeItems}
          actionsRef={actionsRef}
          collectionOptions={collectionOptions}
          {...other}
        >
          <Tree.List>
            {(item: TreeDefaultItem) =>
              checkboxSelection ? (
                <Tree.Item key={item.id} itemId={item.id}>
                  <Tree.ItemContent>
                    <Tree.ItemCheckbox>
                      <Tree.ItemCheckboxIndicator />
                    </Tree.ItemCheckbox>
                    <Tree.ItemExpansionTrigger />
                    <span data-testid="text">{item.label}</span>
                  </Tree.ItemContent>
                </Tree.Item>
              ) : (
                <Tree.Item key={item.id} itemId={item.id}>
                  <Tree.ItemContent>
                    <Tree.ItemExpansionTrigger />
                    <span data-testid="text">{item.label}</span>
                  </Tree.ItemContent>
                </Tree.Item>
              )
            }
          </Tree.List>
        </FilterableTreeRoot>
      );

      const result = await baseRender(element);

      return {
        actionsRef,
        setProps: result.setProps,
        setItems: async (newItems: readonly DescribeTreeItem[]) => {
          await result.setProps({
            items: customItemToChildren ? (newItems as any) : convertItems(newItems),
          });
          // Flush requestAnimationFrame callbacks scheduled during the render
          // (e.g., focus management moves focus when the focused item is removed).
          // In browser mode, act() does not flush rAF callbacks automatically.
          await act(async () => {
            await new Promise<void>((resolve) => {
              requestAnimationFrame(() => resolve());
            });
          });
        },
        ...getUtils(result),
      };
    };

    testRunner({ render: treeRender });
  });
}
