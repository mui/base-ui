'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { warn } from '@base-ui/utils/warn';
import type {
  VirtualizerActiveIndex,
  VirtualizerGroup,
  VirtualizerGroupHeaderMetadata,
  VirtualizerItemAria,
  VirtualizerItemMetadata,
  VirtualizerItemMetrics,
  VirtualizerScrollToIndexOptions,
} from './types';

/**
 * Imperative operations a virtualizer exposes to the component hosting it.
 */
export interface VirtualizerHandle {
  /**
   * Returns the index of the last item starting at or before the given scroll position.
   */
  getIndexAtOffset: (offset: number) => number | null;
  /**
   * Returns the element that scrolls the windowed collection, or `null` before it is attached.
   *
   * A getter rather than a value: the element arrives through a ref, without a render, so a
   * property captured on the handle when it is created would stay `null` for the handle's life.
   * A host needs the element itself to observe scrolling, since a scroll event does not bubble
   * out of the element that scrolls.
   */
  getScrollElement: () => HTMLElement | null;
  /**
   * Returns the logical geometry for an item, including when it is outside the rendered window.
   */
  getItemMetrics: (index: number) => VirtualizerItemMetrics | null;
  /**
   * Scrolls an item into view by its logical collection index.
   */
  scrollToIndex: (index: number, options?: VirtualizerScrollToIndexOptions) => void;
  /**
   * Discards measured item heights so they are taken again against the current layout.
   */
  remeasure: () => void;
  /**
   * Resets the virtualizer's scroll position to the start of the list.
   */
  resetScroll: () => void;
}

/**
 * A virtualizer registered with its host: its imperative operations, plus the state the host
 * needs to tell which behaviors the virtualizer currently owns.
 */
export interface VirtualizerRegistration extends VirtualizerHandle {
  /**
   * Whether the virtualizer is currently mounting a window of rows and owning the scroll position.
   * A disabled virtualizer renders the whole collection and behaves like a plain scrolling list.
   */
  enabled: boolean;
}

/**
 * Coordinates virtualized and non-virtualized content rendered by a single host.
 */
export interface VirtualizerRegistry {
  /**
   * Called when a virtualizer registers, unregisters, or replaces its registration — which it does
   * whenever `enabled` changes.
   *
   * The `virtualizer` field below is mutable and notifies nobody, which is enough for a host that
   * only reads it from an effect or an event handler: registration happens in the virtualizer's
   * layout effect, and React runs those child-first, so every ancestor effect in the same commit
   * already sees it. A host that must know while *rendering* — to choose a prop rather than to run
   * an effect — needs this instead, and must hold the result in React state rather than in an
   * external store: a state update made from the layout-effect phase is flushed before paint,
   * while a store subscription is installed passively, after it.
   */
  onVirtualizerChange?: ((virtualizer: VirtualizerRegistration | null) => void) | undefined;
  /**
   * The registered virtualizer. A host supports at most one; the binding warns when more than one
   * registers.
   */
  virtualizer: VirtualizerRegistration | null;
}

/**
 * Creates the virtualization registry owned by a host's root.
 */
export function createVirtualizerRegistry(): VirtualizerRegistry {
  const registry: RegistryWithStaticItems = {
    nonVirtualItemCount: 0,
    virtualizer: null,
  };
  return registry;
}

/**
 * The registry as the virtualizer keeps it: it also counts the item parts a host renders outside
 * the virtualizer, which only `useVirtualizerItem` maintains.
 */
interface RegistryWithStaticItems extends VirtualizerRegistry {
  nonVirtualItemCount: number;
}

/**
 * Whether a host's list currently renders item parts outside the virtualizer, which it must not
 * alongside one.
 */
export function hasStaticItems(registry: VirtualizerRegistry) {
  return ((registry as RegistryWithStaticItems).nonVirtualItemCount ?? 0) > 0;
}

export function warnAboutStaticItems(componentName: string) {
  warn(
    `<${componentName}.List> must not render static <${componentName}.Item> elements alongside ` +
      '<Virtualizer>. Render every list item through the virtualizer.',
  );
}

/**
 * Stable wiring published by a component so `<Virtualizer>` can window its collection.
 *
 * Kept free of reactive state: an `<Item>` reads this context to detect that it is inside a host,
 * so a changing value here would re-render every item on each highlight change. The collection and
 * the highlight travel through {@link VirtualizerHostState} instead.
 */
export interface VirtualizerHost {
  /**
   * Part namespace of the host, used to reference the right parts in diagnostics
   * (`Combobox` produces `<Combobox.Root>`, `<Combobox.Item>`, and so on).
   */
  componentName: string;
  /**
   * Which ARIA the host's items state for their position in the collection. `set` is the default:
   * `aria-posinset` and `aria-setsize` for the item's place in the flat collection, which is what
   * the options of a listbox need. A host whose items are placed relative to something else — the
   * items of a tree, placed among their siblings — publishes `none` and states the position
   * itself. The virtualizer's `itemAria` prop overrides whatever the host declares.
   */
  itemAria?: VirtualizerItemAria | undefined;
  /**
   * Coordinates virtualized and non-virtualized content rendered by the host.
   */
  registry: VirtualizerRegistry;
  /**
   * Whether every row renders the host's own item part, which reads its metadata with
   * `useVirtualizerItem()`. The virtualizer then warns when an item renderer returns none of them,
   * or several. A host whose rows are plain elements spreading the renderer's third argument
   * leaves it out.
   */
  rendersItemPart?: boolean | undefined;
  /**
   * Warns about configurations the host cannot window, in its own vocabulary. Called once while a
   * virtualizer is mounted, so a host that can be windowed says nothing. Development only.
   */
  warnUnsupportedConfiguration?: (() => void) | undefined;
}

/**
 * Reactive state the virtualizer windows against. Only `<Virtualizer>` subscribes to it.
 *
 * The collection is always the flat, ordered sequence of items; a host that groups them publishes
 * the grouped view of that same sequence alongside, never instead. A hierarchy is published as the
 * sequence it is displayed as — a tree publishes its expanded rows in order — and the hierarchy
 * itself lives in the host's own item metadata, not in the collection's shape.
 */
export interface VirtualizerHostState {
  /**
   * The item the host currently points at, or `null` when it points at none. The virtualizer
   * keeps that row mounted even when it falls outside the rendered window, so it can hold focus
   * or be referenced by `aria-activedescendant`.
   *
   * An index alone is an activation that scrolls, as it is for the `activeIndex` prop. Publish
   * `{ index, scroll: false }` for an activation that must leave the viewport alone, such as a
   * highlight following the pointer, along with the `align`, `paddingStart` and `paddingEnd` the
   * scroll wants. Carrying the decision with the index is what keeps the two from disagreeing:
   * re-publishing an equal activation does not scroll again, and a highlight that stops following
   * the pointer cannot scroll to wherever the pointer last rested.
   */
  activeIndex: VirtualizerActiveIndex | null;
  /**
   * The grouped view of `items`: the same filtered collection, partitioned into groups in order,
   * so that the group item counts sum to `items.length`. Omitted by a host that is not grouped.
   */
  groups?: ReadonlyArray<VirtualizerGroup<unknown>> | undefined;
  /**
   * The flat, ordered collection to window.
   */
  items: ReadonlyArray<unknown>;
  /**
   * Whether the active item should be scrolled into view.
   *
   * @deprecated Publish the decision on `activeIndex` instead — `{ index, scroll: false }` for an
   * activation that must not move the viewport. This flag describes the host rather than the
   * change, so flipping it back to `true` without moving `activeIndex` scrolls to whatever was
   * pointed at last. It is read only for an `activeIndex` published as a bare index.
   */
  scrollActiveIntoView?: boolean | undefined;
  /**
   * Whether the host currently needs every item mounted, which suspends windowing for as long as
   * it is `true`. A host that never needs this omits the field.
   *
   * The virtualizer measures its viewport while windowed, so a suspension invalidates that
   * measurement: a scrollport constrained only by a maximum height grows to fit the whole
   * collection, and the observer reports the expanded box. It re-measures when this returns to
   * `false`, which means the host **must clear it while the virtualizer is still mounted**. A host
   * that unmounts the virtualizer first — by releasing whatever kept the list rendered — loses the
   * transition and leaves the engine sizing its window from a viewport that no longer exists.
   */
  windowingSuspended?: boolean | undefined;
}

export const VirtualizerHostContext = React.createContext<VirtualizerHost | undefined>(undefined);

export const VirtualizerHostStateContext = React.createContext<VirtualizerHostState | undefined>(
  undefined,
);

/**
 * Returns the surrounding host's virtualization wiring, or `undefined` outside of a host.
 */
export function useVirtualizerHost() {
  return React.useContext(VirtualizerHostContext);
}

/**
 * Returns the surrounding host's collection and highlight state, or `undefined` outside of a host.
 */
export function useVirtualizerHostState() {
  return React.useContext(VirtualizerHostStateContext);
}

/**
 * Metadata a row publishes to the host's item part, including the registration the virtualizer
 * counts to tell that the part was rendered.
 */
interface VirtualizerItemChannelValue extends VirtualizerItemMetadata {
  registerItem: (() => () => void) | undefined;
}

/**
 * The channel every row rendered for a host publishes its metadata through. A host provider
 * clears it for its subtree, so a list nested inside another list's row does not read the row it
 * is rendered in.
 */
export const VirtualizerItemContext = React.createContext<VirtualizerItemChannelValue | undefined>(
  undefined,
);

/**
 * The channel every group header rendered for a host publishes the id it is named by through.
 */
export const VirtualizerGroupHeaderContext = React.createContext<
  VirtualizerGroupHeaderMetadata | undefined
>(undefined);

export interface VirtualizerHostProviderProps {
  /**
   * The host's stable wiring, or `undefined` to publish none — around a part rendered outside the
   * host's list element, such as a root nested in another list's row.
   */
  host: VirtualizerHost | undefined;
  /** The collection and the activation the virtualizer windows against. */
  state: VirtualizerHostState | undefined;
  children?: React.ReactNode;
}

/**
 * Publishes a host's collection to the `<Virtualizer>` rendered inside it. Render it around the
 * list element, where the host's item parts are. The item and group-header metadata of any row
 * this is rendered in stop here: the parts inside belong to this host, not to that row.
 */
export function VirtualizerHostProvider(props: VirtualizerHostProviderProps) {
  const { children, host, state } = props;

  return (
    <VirtualizerHostContext.Provider value={host}>
      <VirtualizerHostStateContext.Provider value={state}>
        <VirtualizerItemContext.Provider value={undefined}>
          <VirtualizerGroupHeaderContext.Provider value={undefined}>
            {children}
          </VirtualizerGroupHeaderContext.Provider>
        </VirtualizerItemContext.Provider>
      </VirtualizerHostStateContext.Provider>
    </VirtualizerHostContext.Provider>
  );
}

/**
 * Returns the metadata of the row a host's item part is rendered in, or `undefined` when the
 * `<Virtualizer>` did not render it. Spread `props` onto the element that represents the item,
 * and use `index` as its place in the collection.
 *
 * Call it from the host's item part, once per item: in development, it is how the virtualizer
 * checks that each row renders exactly one, and that no item part is rendered outside it.
 */
export function useVirtualizerItem(): VirtualizerItemMetadata | undefined {
  const host = React.useContext(VirtualizerHostContext);
  const item = React.useContext(VirtualizerItemContext);

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => item?.registerItem?.(), [item]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
      if (host == null || item != null) {
        return undefined;
      }

      // An item part of the host's list that no row rendered: a static item, which the list must
      // not render alongside a virtualizer, in whichever order the two mount.
      const registry = host.registry as RegistryWithStaticItems;
      registry.nonVirtualItemCount = (registry.nonVirtualItemCount ?? 0) + 1;

      if (registry.virtualizer != null) {
        warnAboutStaticItems(host.componentName);
      }

      return () => {
        registry.nonVirtualItemCount -= 1;
      };
    }, [host, item]);
  }

  return item;
}

/**
 * Returns the metadata of the group header a host's group-label part is rendered in, or
 * `undefined` outside one. The label adopts `id`, which the group's wrapper references.
 */
export function useVirtualizerGroupHeader(): VirtualizerGroupHeaderMetadata | undefined {
  return React.useContext(VirtualizerGroupHeaderContext);
}

/**
 * Registers a virtualizer with its host for as long as it is mounted, and again whenever its
 * registration changes. A standalone virtualizer, outside any host, registers nowhere.
 */
export function useVirtualizerRegistration(
  host: VirtualizerHost | undefined,
  registration: VirtualizerRegistration,
) {
  useIsoLayoutEffect(() => {
    if (host == null) {
      return undefined;
    }

    const { registry } = host;

    if (process.env.NODE_ENV !== 'production') {
      if (registry.virtualizer != null) {
        warn(`<${host.componentName}.Root> must not contain more than one <Virtualizer>.`);
      }
      if (hasStaticItems(registry)) {
        warnAboutStaticItems(host.componentName);
      }
    }

    registry.virtualizer = registration;
    registry.onVirtualizerChange?.(registration);
    return () => {
      if (registry.virtualizer === registration) {
        registry.virtualizer = null;
        registry.onVirtualizerChange?.(null);
      }
    };
  }, [host, registration]);
}
