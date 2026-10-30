import type { HTMLProps } from '../internals/types';
import { compareItemEquality } from '../internals/itemEquality';
import { hasNullItemLabel } from '../internals/resolveValueLabel';
import type { AriaCombobox } from './root/AriaCombobox';
import type { VirtualizerRegistry } from '../virtualizer/host';
import type { AdaptiveOriginMiddleware } from '../utils/popups/positioning/adaptiveOriginConstants';
import type { PopupInteractionReader, PositioningInteractionStore } from '../utils/popups/types';
import { popupStoreSelectors } from '../utils/popups/store';
import { ValuePopupStore, valuePopupSelectors } from '../utils/popups/value-popup/ValuePopupStore';
import type {
  ValuePopupContext,
  ValuePopupState,
} from '../utils/popups/value-popup/ValuePopupStore';

export type State = ValuePopupState & {
  items: readonly any[] | undefined;

  inline: boolean;

  highlightType: AriaCombobox.HighlightEventReason;

  listProps: HTMLProps;
  inputProps: HTMLProps;
  // Root values every item reads, combined so each item needs a single subscription for them.
  itemRoot: {
    props: HTMLProps;
    id: string | undefined;
    selectionMode: 'single' | 'multiple' | 'none';
    disabled: boolean;
    readOnly: boolean;
    isItemEqualToValue: (itemValue: any, selectedValue: any) => boolean;
  };

  /**
   * The id of the popup element, which the trigger points at with `aria-controls` while the input
   * is inside the popup.
   */
  popupElementId: string | undefined;
  inputElement: HTMLInputElement | null;
  inputGroupElement: HTMLDivElement | null;

  inputInsidePopup: boolean;
  inputOwnsFormValue: boolean;

  name: string | undefined;
  form: string | undefined;
  grid: boolean;
  externallyVirtualized: boolean;
  /**
   * Whether every item is temporarily mounted so browser autofill can read their rendered labels.
   * Published across the virtualization seam as `windowingSuspended`.
   */
  renderAllRows: boolean;
  openOnInputClick: boolean;
  isItemDisabled?: ((item: any, index: number) => boolean) | undefined;
  autoHighlight: false | 'always' | 'input-change';
  submitOnItemClick: boolean;
  hasInputValue: boolean;

  // The shared positioner reads these. A combobox has neither an instant transition nor an
  // adaptive origin, so they stay `undefined`.
  instantType: undefined;
  adaptiveOrigin: AdaptiveOriginMiddleware | undefined;
};

/**
 * Non-reactive values shared with the combobox parts. Nothing here is observable through
 * `selectors`, so writing to a ref never notifies subscribers.
 */
export type ComboboxStoreContext = ValuePopupContext<AriaCombobox.OpenChangeEventDetails> & {
  /**
   * Part namespace of the root this store belongs to, so diagnostics name the parts the reader
   * actually has in their tree. `AriaCombobox` backs more than one public component.
   */
  readonly componentName: string;
  /** Coordinates the built-in virtualizer with the items rendered outside it. */
  readonly virtualizationRegistry: VirtualizerRegistry;
  /** The popup element. */
  readonly popupRef: React.RefObject<HTMLDivElement | null>;
  /** The empty-state element. */
  readonly emptyRef: React.RefObject<HTMLDivElement | null>;
  /** The input element that owns the combobox role. */
  readonly inputRef: React.RefObject<HTMLInputElement | null>;
  /** Internal dismiss button rendered before the popup content. */
  readonly startDismissRef: React.RefObject<HTMLSpanElement | null>;
  /** Internal dismiss button rendered after the popup content. */
  readonly endDismissRef: React.RefObject<HTMLSpanElement | null>;
  /** Container holding the selection chips. */
  readonly chipsContainerRef: React.RefObject<HTMLDivElement | null>;
  /** The clear button. */
  readonly clearRef: React.RefObject<HTMLButtonElement | null>;
  /** Item element that received the last pointerdown, to pair it with a mouseup. */
  readonly pointerDownItemRef: React.RefObject<Element | null>;
  /** Native event that triggered the in-flight selection. */
  readonly selectionEventRef: React.RefObject<MouseEvent | PointerEvent | KeyboardEvent | null>;

  // Commands. Seeded with `NOOP` when the store is constructed and assigned during the root's
  // first render, so they are not `readonly`.

  /** Clears what the open session left behind once the popup unmounts. */
  handleUnmount: () => void;
  /** Sets the input value. */
  setInputValue: (value: string, eventDetails: AriaCombobox.ChangeEventDetails) => void;
  /** Sets the selected value. */
  setSelectedValue: (value: any, eventDetails: AriaCombobox.ChangeEventDetails) => void;
  /** Sets the active and/or selected index. */
  setIndices: (indices: {
    activeIndex?: number | null | undefined;
    selectedIndex?: number | null | undefined;
    type?: AriaCombobox.HighlightEventReason | undefined;
    event?: Event | undefined;
  }) => void;
  /** Mounts the popup subtree without opening it, to resolve derived item labels. */
  forceMount: () => void;
  /** Applies a selection originating from an item. */
  handleSelection: (event: MouseEvent | PointerEvent | KeyboardEvent, itemValue: any) => void;
  /** Requests submission of the owning form. */
  requestSubmit: () => void;
};

type VirtualizationStore = {
  state: { renderAllRows: boolean };
  set: (key: 'renderAllRows', value: boolean) => void;
};

/**
 * Mounts or releases the whole collection for a browser autofill label pass.
 *
 * A built-in `<Virtualizer>` reads this as its windowing being suspended, and re-measures its
 * viewport when it is cleared, or when it mounts again after the list was released.
 *
 * Repeating a request is not a new pass, so an unchanged value publishes nothing: a redundant
 * notification would arm a viewport restore for a suspension that never happened.
 */
export function setVirtualizationRenderAllRows(store: VirtualizationStore, renderAllRows: boolean) {
  if (store.state.renderAllRows === renderAllRows) {
    return;
  }

  store.set('renderAllRows', renderAllRows);
}

export const selectors = {
  ...valuePopupSelectors,
  items: (state: State) => state.items,
  hasNullItemLabel: (state: State, enabled: boolean) =>
    enabled ? hasNullItemLabel(state.items) : false,

  hasSelectionChips: (state: State) => {
    const selectedValue = state.selectedValue;
    return Array.isArray(selectedValue) && selectedValue.length > 0;
  },

  hasSelectedValue: (state: State) => {
    const { selectedValue, selectionMode } = state;
    if (selectedValue == null) {
      return false;
    }
    if (selectionMode === 'multiple' && Array.isArray(selectedValue)) {
      return selectedValue.length > 0;
    }
    return true;
  },

  inline: (state: State) => state.inline,

  highlightType: (state: State) => state.highlightType,
  isSelected: (state: State, itemValue: any) => {
    const comparer = state.isItemEqualToValue;
    const selectedValue = state.selectedValue;
    if (Array.isArray(selectedValue)) {
      return selectedValue.some((selectedItem) =>
        compareItemEquality(itemValue, selectedItem, comparer),
      );
    }
    return compareItemEquality(itemValue, selectedValue, comparer);
  },

  listProps: (state: State) => state.listProps,
  inputProps: (state: State) => state.inputProps,
  itemRoot: (state: State) => state.itemRoot,

  popupElementId: (state: State) => state.popupElementId,
  inputElement: (state: State) => state.inputElement,
  inputGroupElement: (state: State) => state.inputGroupElement,
  // See `interactions`.
  interactionOpen: (state: State) => popupStoreSelectors.open(state) || state.inline,
  // The shared selector hides the positioner while an opening popup mounts, which list navigation
  // reads as the list going away, resetting the highlight that typing just set.
  interactionPositionerElement: (state: State) => state.positionerElement,

  inputInsidePopup: (state: State) => state.inputInsidePopup,
  inputOwnsFormValue: (state: State) => state.inputOwnsFormValue,

  name: (state: State) => state.name,
  form: (state: State) => state.form,
  grid: (state: State) => state.grid,
  externallyVirtualized: (state: State) => state.externallyVirtualized,
  renderAllRows: (state: State) => state.renderAllRows,
  isItemDisabled: (state: State) => state.isItemDisabled,
  autoHighlight: (state: State) => state.autoHighlight,
  instantType: (state: State) => state.instantType,
  adaptiveOrigin: (state: State) => state.adaptiveOrigin,
};

export class ComboboxStore extends ValuePopupStore<
  State,
  ComboboxStoreContext,
  typeof selectors,
  AriaCombobox.OpenChangeEventDetails
> {
  /**
   * The store the interaction hooks read. An inline list renders for as long as it's in the tree,
   * so the hooks see it as open (`interactionOpen`) even while the open state is `false`. They also
   * see the positioner element for as long as it's in the DOM. Everything else is the store itself.
   */
  readonly interactions: PositioningInteractionStore = createInteractionView(this);

  // The input, or the trigger when the input is inside the popup.
  protected getAnchorElement(state: Readonly<State>) {
    return state.inputInsidePopup ? state.triggerElement : state.inputElement;
  }

  // The input requests an open on every keystroke and press; only an actual change is one.
  protected isOpenChangeIgnored(nextOpen: boolean) {
    return nextOpen === this.select('open');
  }

  protected prepareUnmount() {
    this.context.handleUnmount();
    return {};
  }
}

type InteractionKey =
  'open' | 'transitionStatus' | 'anchorElement' | 'anchor' | 'positionerElement' | 'defaultPopupId';

function createInteractionView(store: ComboboxStore): PositioningInteractionStore {
  const getKey = (key: InteractionKey): keyof typeof selectors => {
    if (key === 'open') {
      return 'interactionOpen';
    }
    return key === 'positionerElement' ? 'interactionPositionerElement' : key;
  };

  return {
    select: ((key: InteractionKey) => store.select(getKey(key))) as PopupInteractionReader,
    useState: ((key: InteractionKey) => store.useState(getKey(key))) as PopupInteractionReader,
    set: (key: 'anchorOverride' | 'anchorElement', value: any) => store.set(key, value),
    setOpen: store.setOpen,
    context: store.context,
    clearPositioning: () => store.clearPositioning(),
  };
}
