import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { Virtualizer } from '@base-ui/react/virtualizer';
import {
  ListVirtualizationHostContext,
  ListVirtualizationListStateContext,
  type ListVirtualizationHost,
  type ListVirtualizationListState,
} from '../src/internals/virtualization/ListVirtualizationHostContext';
import {
  createListVirtualizationRegistry,
  type VirtualizerHandle,
} from '../src/internals/virtualization/ListVirtualizationRegistry';
import type {
  VirtualizerItemMetadata,
  VirtualizerItemProps,
} from '../src/internals/virtualization/types';

/**
 * The item shape the default renderers understand. Hosts are generic over the item, so a test
 * that needs raw primitives or objects of its own shape supplies its own renderer.
 */
export interface TestItem {
  label: string;
  /** Overrides the identity derived from the label, for tests that vary row identity. */
  key?: string | number | undefined;
}

export function createItems(count: number): TestItem[] {
  return Array.from({ length: count }, (_, index) => ({
    label: `Item ${index + 1}`,
  }));
}

export const TestVirtualItemContext = React.createContext<VirtualizerItemMetadata | undefined>(
  undefined,
);

/**
 * Stands in for a list's `<Item>`: applies the collection metadata the virtualizer supplies and
 * registers itself as the single item rendered for its row.
 */
export function TestListItem(props: { children: React.ReactNode; style?: React.CSSProperties }) {
  const virtualItem = React.useContext(TestVirtualItemContext);

  useIsoLayoutEffect(() => virtualItem?.registerItem?.(), [virtualItem]);

  return (
    <div role="listitem" {...virtualItem?.props} style={props.style}>
      {props.children}
    </div>
  );
}

export function renderItem(item: TestItem, _index: number) {
  return <TestListItem style={{ height: 20 }}>{item.label}</TestListItem>;
}

export function renderItemOf(height: number) {
  return function renderMeasuredItem(item: TestItem) {
    return <TestListItem style={{ height }}>{item.label}</TestListItem>;
  };
}

// A `type`, not an `interface`: `Virtualizer.Props` carries a conditional type for `getItemKey`,
// which an interface cannot extend.
export type TestVirtualizedListProps<Item> = Omit<
  Virtualizer.Props<Item>,
  'children' | 'getItemKey' | 'items'
> & {
  /**
   * The item the list points at, published as the seam's `activeIndex`. Kept mounted outside the
   * window, and scrolled to when `scrollActiveIntoView` is `true`.
   */
  activeIndex?: number | null | undefined;
  /** Receives the imperative handle the virtualizer registers with the list. */
  apiRef?: React.RefObject<VirtualizerHandle | null> | undefined;
  /**
   * Row renderer. The third argument carries the row's collection metadata for renderers that
   * spread it onto a plain element instead of using `TestListItem`.
   */
  children: (item: Item, index: number, itemProps: VirtualizerItemProps) => React.ReactElement;
  /**
   * Defaults to `item.key ?? item.label` for `TestItem`-shaped collections. For anything else it
   * is left unset, so the virtualizer keys the values itself — which is what a test of its own
   * primitive-value keying needs.
   */
  getItemKey?: ((item: Item) => string | number) | undefined;
  items: readonly Item[];
  /**
   * Row retained outside the rendered window without being scrolled to — a pointer highlight.
   * Sugar for `activeIndex` with `scrollActiveIntoView={false}`; an explicit `activeIndex` wins.
   */
  pinnedRowIndex?: number | undefined;
  /**
   * Whether activating `activeIndex` scrolls it into view. Defaults to `true` for `scrollToRowIndex`
   * and `false` for `pinnedRowIndex`; set it directly to describe a transition between the two on
   * one host, which is what tests of the scroll decision need.
   */
  scrollActiveIntoView?: boolean | undefined;
  /**
   * Row that should be scrolled into view — a keyboard highlight. Sugar for `activeIndex` with
   * `scrollActiveIntoView={true}`; an explicit `activeIndex` wins.
   */
  scrollToRowIndex?: number | undefined;
  /**
   * Published verbatim, so a host that omits the field can be compared against one that
   * publishes `false`.
   */
  windowingSuspended?: boolean | undefined;
};

function isTestItemCollection(items: readonly unknown[]): items is readonly TestItem[] {
  return items.every(
    (item) =>
      typeof item === 'object' && item !== null && typeof (item as TestItem).label === 'string',
  );
}

function testItemKey(item: TestItem) {
  return item.key ?? item.label;
}

/**
 * Minimal list host, standing in for a component like `<Combobox.List>`. It keeps tests on the
 * windowing behavior itself, and doubles as a check that the host contract is implementable
 * outside of the components that ship with it.
 */
export function TestVirtualizedList<Item = TestItem>(props: TestVirtualizedListProps<Item>) {
  const {
    activeIndex: activeIndexProp,
    apiRef,
    getItemKey,
    items,
    pinnedRowIndex,
    scrollActiveIntoView: scrollActiveIntoViewProp,
    scrollToRowIndex,
    windowingSuspended,
    ...virtualizerProps
  } = props;

  const registry = React.useRef(createListVirtualizationRegistry()).current;

  const host = React.useMemo<ListVirtualizationHost>(
    () => ({
      // A name of its own, so a diagnostic raised through this host cannot be mistaken for one
      // raised through a real list.
      componentName: 'TestList',
      registry,
      virtualItemContext: TestVirtualItemContext,
    }),
    [registry],
  );

  const activeIndex = activeIndexProp ?? scrollToRowIndex ?? pinnedRowIndex ?? null;
  const scrollActiveIntoView = scrollActiveIntoViewProp ?? scrollToRowIndex != null;

  const listState = React.useMemo<ListVirtualizationListState>(
    () => ({
      activeIndex,
      items,
      scrollActiveIntoView,
      windowingSuspended,
    }),
    [activeIndex, items, scrollActiveIntoView, windowingSuspended],
  );

  React.useImperativeHandle<VirtualizerHandle | null, VirtualizerHandle | null>(
    apiRef,
    () => registry.virtualizer,
    [registry],
  );

  return (
    <ListVirtualizationHostContext.Provider value={host}>
      <ListVirtualizationListStateContext.Provider value={listState}>
        <Virtualizer<Item>
          getItemKey={
            (getItemKey ?? (isTestItemCollection(items) ? testItemKey : undefined)) as (
              item: Item,
            ) => string | number
          }
          {...virtualizerProps}
        />
      </ListVirtualizationListStateContext.Provider>
    </ListVirtualizationHostContext.Provider>
  );
}
