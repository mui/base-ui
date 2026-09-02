'use client';
import * as React from 'react';
import { warn } from '@base-ui/utils/warn';
import type { HTMLProps } from '../types';
import type { ListVirtualizationRegistry } from './ListVirtualizationRegistry';
import type { VirtualizerItemMetadata } from './types';

/**
 * Stable wiring published by a list component so `<Virtualizer>` can bind to it.
 *
 * Kept free of reactive state: `<Item>` reads this context to detect that it is inside a list, so a
 * changing value here would re-render every item on each highlight change.
 */
export interface ListVirtualizationHost {
  /**
   * Part namespace of the owning list, used to reference the right parts in diagnostics
   * (`Combobox` produces `<Combobox.Root>`, `<Combobox.Item>`, and so on).
   */
  componentName: string;
  /**
   * Coordinates virtualized and non-virtualized content rendered by the list.
   */
  registry: ListVirtualizationRegistry;
  /**
   * Channel the list's `<Item>` reads its collection and accessibility metadata from.
   */
  virtualItemContext: React.Context<VirtualizerItemMetadata | undefined>;
  /**
   * Warns about configurations the list cannot window, in its own vocabulary. Called once while a
   * virtualizer is mounted, so a list that can be windowed says nothing. Development only.
   */
  warnUnsupportedConfiguration?: (() => void) | undefined;
}

/**
 * Reactive list state the virtualizer windows against. Only `<Virtualizer>` subscribes to it.
 *
 * Deliberately limited to flat collections: any list whose rows are a single ordered sequence can
 * implement it, while hierarchical collections need a virtualizer of their own.
 */
export interface ListVirtualizationListState {
  /**
   * Index of the item the list currently points at, or `null` when it points at none. The
   * virtualizer keeps that row mounted even when it falls outside the rendered window, so it can
   * hold focus or be referenced by `aria-activedescendant`.
   */
  activeIndex: number | null;
  /**
   * The flat, ordered collection to window.
   */
  items: ReadonlyArray<unknown>;
  /**
   * Whether the active item should be scrolled into view. Lists that also point at items with the
   * pointer pass `false` for those, since scrolling would move the list under the cursor.
   */
  scrollActiveIntoView: boolean;
  /**
   * Props the list contributes to the virtualizer's scrollport.
   *
   * The virtualizer is the element that scrolls, so behavior a list would otherwise put on its own
   * scrolling element belongs here instead: a scroll handler, or a class that styles the
   * scrollbar. Merged ahead of the props passed to `<Virtualizer>` itself, so an application's own
   * props still win.
   */
  scrollportProps?: HTMLProps | undefined;
  /**
   * Whether the list currently needs every item mounted, which suspends windowing for as long as
   * it is `true`. A list that never needs this omits the field.
   *
   * The virtualizer measures its viewport while windowed, so a suspension invalidates that
   * measurement: a scrollport constrained only by a maximum height grows to fit the whole
   * collection, and the observer reports the expanded box. It re-measures when this returns to
   * `false`, which means the list **must clear it while the virtualizer is still mounted**. A list
   * that unmounts the virtualizer first — by releasing whatever kept the list rendered — loses the
   * transition and leaves the engine sizing its window from a viewport that no longer exists.
   */
  windowingSuspended?: boolean | undefined;
}

/**
 * The component that owns a list, published above the part that actually hosts a virtualizer.
 *
 * A virtualizer given its own `items` needs no host, so nothing would otherwise notice one placed
 * in the wrong part of a list that supports virtualization — it would quietly window its own
 * collection while the list around it went on managing a collection of its own. This names the
 * part it should have been placed in, so that mistake can be reported.
 */
export interface ListVirtualizationOwner {
  /**
   * Part namespace of the owning component, such as `Select`.
   */
  componentName: string;
  /**
   * The part that must contain the virtualizer, such as `Select.List`.
   */
  listPartName: string;
}

export const ListVirtualizationHostContext = React.createContext<
  ListVirtualizationHost | undefined
>(undefined);

export const ListVirtualizationOwnerContext = React.createContext<
  ListVirtualizationOwner | undefined
>(undefined);

export const ListVirtualizationListStateContext = React.createContext<
  ListVirtualizationListState | undefined
>(undefined);

/**
 * Returns the surrounding list's virtualization host, or `undefined` outside of a supported list.
 */
export function useListVirtualizationHost() {
  return React.useContext(ListVirtualizationHostContext);
}

/**
 * Returns the surrounding list's virtualization host and state, if there is one.
 *
 * A virtualizer given its own collection through the `items` prop renders without a list, so this
 * only throws when neither source is available.
 */
export function useListVirtualization(hasOwnCollection: boolean) {
  const host = React.useContext(ListVirtualizationHostContext);
  const listState = React.useContext(ListVirtualizationListStateContext);
  const owner = React.useContext(ListVirtualizationOwnerContext);

  if (!hasOwnCollection && (!host || !listState)) {
    throw new Error(
      'Base UI: <Virtualizer> was rendered without an `items` prop and outside of a list ' +
        'that supports virtualization, so it has no collection to render. Pass `items`, or ' +
        'place it inside the list part that supports it, such as <Combobox.List>, ' +
        '<Autocomplete.List>, or <Select.List>. ' +
        'Documentation: https://base-ui.com/react/utils/virtualizer',
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      // An own collection satisfies the check above, so a virtualizer placed outside the list part
      // renders without complaint. Only the owner knows which part that should have been.
      if (owner != null && host == null) {
        warn(
          `<Virtualizer> must be placed inside <${owner.listPartName}>. ` +
            `Rendered elsewhere in <${owner.componentName}.Root>, it windows its own \`items\` ` +
            'without connecting to the list, so keyboard navigation, selection, and ' +
            'accessibility metadata are left unwired.',
        );
      }
    }, [host, owner]);
  }

  return { host, listState };
}
