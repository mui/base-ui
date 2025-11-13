import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui-components/utils/store';
import { EMPTY_OBJECT } from '@base-ui-components/utils/empty';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import type { HTMLProps } from '../../utils/types';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import type { CommandPaletteRoot } from '../root/CommandPaletteRoot';

export type State = {
  readonly open: boolean;
  readonly mounted: boolean;
  readonly query: string;
  readonly selectedIndex: number | null;
  readonly transitionStatus: TransitionStatus;
  readonly popupElement: HTMLElement | null;
  readonly inputElement: HTMLElement | null;
  readonly listElement: HTMLElement | null;
  readonly itemElements: (HTMLElement | null)[];
  readonly filteredItems: CommandPaletteItem[];
  readonly popupProps: HTMLProps;
  readonly inputProps: HTMLProps;
};

export interface CommandPaletteItem {
  id: string;
  label: string;
  keywords?: string[];
  disabled?: boolean;
  onSelect?: () => void;
}

type Context = {
  readonly popupRef: React.RefObject<HTMLElement | null>;
  readonly inputRef: React.RefObject<HTMLElement | null>;
  readonly listRef: React.RefObject<HTMLElement | null>;
  readonly itemRefs: React.RefObject<(HTMLElement | null)[]>;
  readonly items: React.RefObject<CommandPaletteItem[]>;
  readonly filterFn: (query: string, items: CommandPaletteItem[]) => CommandPaletteItem[];
  readonly onOpenChange?: (
    open: boolean,
    eventDetails: CommandPaletteRoot.ChangeEventDetails,
  ) => void;
  readonly onOpenChangeComplete?: (open: boolean) => void;
};

const selectors = {
  open: createSelector((state: State) => state.open),
  mounted: createSelector((state: State) => state.mounted),
  query: createSelector((state: State) => state.query),
  selectedIndex: createSelector((state: State) => state.selectedIndex),
  transitionStatus: createSelector((state: State) => state.transitionStatus),
  popupElement: createSelector((state: State) => state.popupElement),
  inputElement: createSelector((state: State) => state.inputElement),
  listElement: createSelector((state: State) => state.listElement),
  itemElements: createSelector((state: State) => state.itemElements),
  filteredItems: createSelector((state: State) => state.filteredItems),
  popupProps: createSelector((state: State) => state.popupProps),
  inputProps: createSelector((state: State) => state.inputProps),
  isSelected: createSelector((state: State, index: number) => state.selectedIndex === index),
};

export type CommandPaletteStoreOptions = {
  filterFn?: (query: string, items: CommandPaletteItem[]) => CommandPaletteItem[];
};

export class CommandPaletteStore extends ReactStore<State, Context, typeof selectors> {
  constructor(options?: CommandPaletteStoreOptions) {
    const defaultFilterFn = (query: string, items: CommandPaletteItem[]) => {
      if (!query.trim()) {
        return items;
      }
      const lowerQuery = query.toLowerCase();
      return items.filter((item) => {
        if (item.disabled) {
          return false;
        }
        const labelMatch = item.label.toLowerCase().includes(lowerQuery);
        const keywordMatch = item.keywords?.some((keyword) =>
          keyword.toLowerCase().includes(lowerQuery),
        );
        return labelMatch || keywordMatch;
      });
    };

    super(
      createInitialState(),
      {
        popupRef: React.createRef<HTMLElement>(),
        inputRef: React.createRef<HTMLElement>(),
        listRef: React.createRef<HTMLElement>(),
        itemRefs: { current: [] },
        items: { current: [] },
        filterFn: options?.filterFn ?? defaultFilterFn,
        onOpenChange: undefined,
        onOpenChangeComplete: undefined,
      },
      selectors,
    );
  }

  public setOpen = (
    nextOpen: boolean,
    eventDetails: Omit<CommandPaletteRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
  ) => {
    (eventDetails as CommandPaletteRoot.ChangeEventDetails).preventUnmountOnClose = () => {
      // No-op for command palette
    };

    this.context.onOpenChange?.(nextOpen, eventDetails as CommandPaletteRoot.ChangeEventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    this.set('open', nextOpen);
    if (nextOpen) {
      this.set('query', '');
      this.set('selectedIndex', null);
    }
  };

  public setQuery = (query: string) => {
    this.set('query', query);
    this.updateFilteredItems();
  };

  public setSelectedIndex = (index: number | null) => {
    this.set('selectedIndex', index);
  };

  public updateFilteredItems = () => {
    const query = this.state.query;
    const items = this.context.items.current;
    const filtered = this.context.filterFn(query, items);
    this.set('filteredItems', filtered);
    // Reset selected index if it's out of bounds
    if (this.state.selectedIndex !== null && this.state.selectedIndex >= filtered.length) {
      this.set('selectedIndex', filtered.length > 0 ? 0 : null);
    }
    // Update itemElements array size
    const itemRefs = this.context.itemRefs.current;
    if (itemRefs) {
      while (itemRefs.length < filtered.length) {
        itemRefs.push(null);
      }
      // Trim if needed (though we keep refs for potential reuse)
      const itemElements = itemRefs.slice(0, filtered.length);
      this.set('itemElements', itemElements);
    }
  };

  public selectItem = (index: number) => {
    const items = this.state.filteredItems;
    if (index >= 0 && index < items.length) {
      const item = items[index];
      if (!item.disabled && item.onSelect) {
        item.onSelect();
        this.setOpen(false, createChangeEventDetails(REASONS.itemPress));
      }
    }
  };
}

function createInitialState(): State {
  return {
    open: false,
    mounted: false,
    query: '',
    selectedIndex: null,
    transitionStatus: 'idle',
    popupElement: null,
    inputElement: null,
    listElement: null,
    itemElements: [],
    filteredItems: [],
    popupProps: EMPTY_OBJECT as HTMLProps,
    inputProps: EMPTY_OBJECT as HTMLProps,
  };
}
