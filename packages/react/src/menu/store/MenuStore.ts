import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import { EMPTY_OBJECT, NOOP } from '@base-ui/utils/empty';
import { platform } from '@base-ui/utils/platform';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { MenuParent, MenuRoot } from '../root/MenuRoot';
import { FloatingTreeStore } from '../../floating-ui-react/components/FloatingTreeStore';
import type { HTMLProps } from '../../internals/types';
import { NullStore } from '../../utils/NullStore';
import type { AdaptiveOriginMiddleware } from '../../utils/adaptiveOriginConstants';
import type { PopupStoreContext, PopupStoreState, PopupTriggerStoreKeys } from '../../utils/popups';
import {
  createInitialPopupStoreState,
  popupStoreSelectors,
  PopupTriggerMap,
} from '../../utils/popups';

export type State<Payload> = PopupStoreState<Payload> & {
  disabled: boolean;
  modal: boolean | undefined;
  openMethod: InteractionType | null;
  /** Whether the popup last opened from the keyboard or an assistive-technology press. */
  keyboardOpen: boolean;
  allowMouseEnter: boolean;
  highlightItemOnHover: boolean;
  parent: MenuParent;
  rootId: string | undefined;
  activeIndex: number | null;
  /** The `Menu.List` element, which takes the `menu` role from the popup when rendered. */
  listElement: HTMLElement | null;
  /**
   * Props a filter root adds to its triggers (dialog semantics and the key relay to the input).
   * Published by the filter implementation so a plain menu never bundles them.
   */
  filterTriggerProps: HTMLProps;
  /** List navigation props for the element that holds real focus under virtual focus. */
  inputProps: HTMLProps;
  /** This menu's filter input while it has focus. */
  focusedInput: HTMLInputElement | null;
  /** The element at `activeIndex` once the item list settles. Only virtual focus publishes it. */
  highlightedItem: HTMLElement | undefined;
  hoverEnabled: boolean;
  instantType: 'dismiss' | 'click' | 'group' | 'trigger-change' | undefined;
  openChangeReason: MenuRoot.ChangeEventReason | null;
  floatingTreeRoot: FloatingTreeStore;
  floatingNodeId: string | undefined;
  floatingParentNodeId: string | null;
  itemProps: HTMLProps;
  closeDelay: number;
  keyboardEventRelay: ((event: React.KeyboardEvent<any>) => void) | undefined;
  adaptiveOrigin: AdaptiveOriginMiddleware | undefined;
};

type Context = PopupStoreContext<MenuRoot.ChangeEventDetails> & {
  readonly positionerRef: React.RefObject<HTMLElement | null>;
  readonly popupRef: React.RefObject<HTMLElement | null>;
  readonly typingRef: React.RefObject<boolean>;
  readonly itemDomElements: React.RefObject<(HTMLElement | null)[]>;
  readonly itemLabels: React.RefObject<(string | null)[]>;
  /** Why the next `activeIndex` write happens, consumed by `onItemHighlighted` on commit. */
  highlightReason: MenuRoot.HighlightEventReason;
  /** The event that caused the next `activeIndex` write, reported along with `highlightReason`. */
  highlightEvent: Event | undefined;
  /** The item last committed as highlighted, kept in every menu so reasons compare against it. */
  reportedItem: HTMLElement | undefined;
  allowMouseUpTriggerRef: React.RefObject<boolean>;
  /** The element that holds real focus while virtual list navigation is active. */
  virtualFocusRef: React.RefObject<HTMLElement | null> | undefined;
  /** Whether a filterable menu's trigger was last pressed by a screen reader. */
  virtualPress?: boolean | undefined;
  readonly triggerFocusTargetRef: React.RefObject<HTMLElement | null>;
  readonly beforeTriggerFocusGuardRef: React.RefObject<HTMLElement | null>;
  readonly beforeContentFocusGuardRef: React.RefObject<HTMLElement | null>;
};

const selectors = {
  ...popupStoreSelectors,
  disabled: (state: State<unknown>) =>
    state.parent.type === 'menubar'
      ? state.parent.context.disabled || state.disabled
      : state.disabled,
  modal: (state: State<unknown>) =>
    (state.parent.type === undefined || state.parent.type === 'context-menu') &&
    (state.modal ?? true),
  openMethod: (state: State<unknown>) => state.openMethod,
  keyboardOpen: (state: State<unknown>) => state.keyboardOpen,

  allowMouseEnter: (state: State<unknown>) => state.allowMouseEnter,
  highlightItemOnHover: (state: State<unknown>) => state.highlightItemOnHover,
  parent: (state: State<unknown>) => state.parent,
  rootId: (state: State<unknown>): string | undefined => {
    if (state.parent.type === 'menu') {
      return state.parent.store.select('rootId');
    }

    return state.parent.type !== undefined ? state.parent.context.rootId : state.rootId;
  },
  activeIndex: (state: State<unknown>) => state.activeIndex,
  listElement: (state: State<unknown>) => state.listElement,
  /** The trigger's `aria-controls`: the list when one holds the `menu` role, else the popup. */
  triggerControlsId: (state: State<unknown>, triggerId: string | undefined) => {
    const popupId = popupStoreSelectors.triggerPopupId(state, triggerId);
    return popupId ? state.listElement?.id || popupId : undefined;
  },
  filterTriggerProps: (state: State<unknown>) => state.filterTriggerProps,
  inputProps: (state: State<unknown>) => state.inputProps,
  // `aria-selected` is invalid on `menuitem`, but Safari VoiceOver needs it for arrow-key
  // navigation. Limit it to WebKit while the input has focus so normal VoiceOver navigation
  // does not encounter the invalid attribute.
  webkitAriaSelected: (state: State<unknown>, highlighted: boolean) =>
    platform.engine.webkit && state.focusedInput != null && highlighted ? true : undefined,
  highlightedItemId: (state: State<unknown>) => state.highlightedItem?.id || undefined,
  isActive: (state: State<unknown>, itemIndex: number) => state.activeIndex === itemIndex,
  hoverEnabled: (state: State<unknown>) => state.hoverEnabled,
  // `trigger-change` describes a popup moving between triggers, which only has
  // meaning while it is open. Dropping it once closed keeps a late or stale
  // restoration from marking a closing popup instant and skipping its exit
  // transition, including on close paths that never reach `setOpen` — a
  // controlled consumer committing `open={false}` goes straight through the prop.
  instantType: (state: State<unknown>) =>
    state.instantType === 'trigger-change' && !popupStoreSelectors.open(state)
      ? undefined
      : state.instantType,
  lastOpenChangeReason: (state: State<unknown>) => state.openChangeReason,
  floatingTreeRoot: (state: State<unknown>): FloatingTreeStore => {
    if (state.parent.type === 'menu') {
      return state.parent.store.select('floatingTreeRoot');
    }

    return state.floatingTreeRoot;
  },
  floatingNodeId: (state: State<unknown>) => state.floatingNodeId,
  floatingParentNodeId: (state: State<unknown>) => state.floatingParentNodeId,
  itemProps: (state: State<unknown>) => state.itemProps,
  closeDelay: (state: State<unknown>) => state.closeDelay,
  adaptiveOrigin: (state: State<unknown>): AdaptiveOriginMiddleware | undefined =>
    state.adaptiveOrigin,
  keyboardEventRelay: (state: State<unknown>): React.KeyboardEventHandler<any> | undefined => {
    if (state.keyboardEventRelay) {
      return state.keyboardEventRelay;
    }

    if (state.parent.type === 'menu') {
      return state.parent.store.select('keyboardEventRelay');
    }

    return undefined;
  },
};

type Selectors = typeof selectors;

/**
 * The store view that detached handle-backed triggers read from. Both the real `MenuStore` and the
 * inert fallback store satisfy it, so a trigger can read from whichever store the handle currently
 * exposes. Narrowed to the members a trigger actually uses — the trigger-data members plus `setOpen`
 * (called by the focus guards) — so the exposed surface can't bypass the open-change pipeline; on
 * the detached fallback store every one of these mutations is a no-op.
 */
export type MenuHandleStore<Payload> = Pick<MenuStore<Payload>, PopupTriggerStoreKeys | 'setOpen'>;

export class MenuStore<Payload> extends ReactStore<Readonly<State<Payload>>, Context, Selectors> {
  constructor(
    initialState?: Partial<State<Payload>>,
    floatingId?: string | undefined,
    nested = false,
  ) {
    const triggerElements = new PopupTriggerMap();
    const state = createInitialState<Payload>(triggerElements, floatingId, nested, initialState);

    super(state, createInitialContext(triggerElements), selectors);

    // Share the mouse-up trigger ref of the parent menu, if any. This observes the store's own
    // state, so the subscription lives exactly as long as the store and needs no cleanup.
    void this.observe('parent', (parent) => {
      if (parent.type === 'menu') {
        this.context.allowMouseUpTriggerRef = parent.store.context.allowMouseUpTriggerRef;
      } else if (parent.type !== undefined) {
        this.context.allowMouseUpTriggerRef = parent.context.allowMouseUpTriggerRef;
      }
    });
  }

  /**
   * Propagates changes of the parent menu's shared tree state to this store's subscribers.
   * The owning `Menu.Root` calls it from an effect so the parent store subscription is released
   * when the submenu unmounts.
   * @returns A function that removes the parent store subscription.
   */
  subscribeToParentMenu() {
    const parent = this.state.parent;
    if (parent.type !== 'menu') {
      return undefined;
    }

    let rootId = parent.store.select('rootId');
    let floatingTreeRoot = parent.store.select('floatingTreeRoot');
    let keyboardEventRelay = parent.store.select('keyboardEventRelay');

    return parent.store.subscribe(() => {
      const nextRootId = parent.store.select('rootId');
      const nextFloatingTreeRoot = parent.store.select('floatingTreeRoot');
      const nextKeyboardEventRelay = parent.store.select('keyboardEventRelay');

      if (
        rootId === nextRootId &&
        floatingTreeRoot === nextFloatingTreeRoot &&
        keyboardEventRelay === nextKeyboardEventRelay
      ) {
        return;
      }

      rootId = nextRootId;
      floatingTreeRoot = nextFloatingTreeRoot;
      keyboardEventRelay = nextKeyboardEventRelay;
      this.notifyAll();
    });
  }

  setOpen(open: boolean, eventDetails: Omit<MenuRoot.ChangeEventDetails, 'preventUnmountOnClose'>) {
    this.state.floatingRootContext.context.events.emit('setOpen', { open, eventDetails });
  }

  setActiveIndex(
    activeIndex: number | null,
    reason: MenuRoot.HighlightEventReason,
    event?: Event | undefined,
  ) {
    // Only a write that changes the index is reported. Tagging a no-op, or a write back to the
    // reported item before the change commits, would let a later registry-driven re-emit report
    // this reason instead of `none`.
    if (this.state.activeIndex !== activeIndex) {
      const item =
        activeIndex === null ? undefined : this.context.itemDomElements.current[activeIndex];
      const isWriteBack = item === this.context.reportedItem;
      this.context.highlightReason = isWriteBack ? 'none' : reason;
      this.context.highlightEvent = isWriteBack ? undefined : event;
    }
    this.set('activeIndex', activeIndex);
  }

  highlightItem(
    element: Element | null,
    reason: MenuRoot.HighlightEventReason,
    event?: Event | undefined,
  ) {
    const index = this.context.itemDomElements.current.indexOf(element as HTMLElement);
    if (index > -1) {
      this.setActiveIndex(index, reason, event);
    }
  }
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no `Menu.Root` is
 * attached. It preserves a menu-specific trigger registry in context so detached triggers can
 * register before migrating to the live root store. `setOpen` is a no-op (matching the inert
 * reads/writes of `NullStore`), so a trigger can hand the store to focus-guard helpers that expect
 * `setOpen` without it ever taking effect while detached.
 */
export function createNullMenuStore<Payload>(): MenuHandleStore<Payload> {
  const triggerElements = new PopupTriggerMap();
  const store = new NullStore<Readonly<State<Payload>>, Context, Selectors>(
    Object.freeze(createInitialState<Payload>(triggerElements)),
    Object.freeze(createInitialContext(triggerElements)),
    selectors,
  );
  return Object.assign(store, { setOpen: NOOP });
}

function createInitialContext(triggerElements: PopupTriggerMap): Context {
  return {
    positionerRef: React.createRef<HTMLElement | null>(),
    popupRef: React.createRef<HTMLElement | null>(),
    typingRef: { current: false },
    itemDomElements: { current: [] },
    itemLabels: { current: [] },
    highlightReason: 'none',
    highlightEvent: undefined,
    reportedItem: undefined,
    allowMouseUpTriggerRef: { current: false },
    virtualFocusRef: undefined,
    triggerFocusTargetRef: React.createRef<HTMLElement>(),
    beforeTriggerFocusGuardRef: React.createRef<HTMLElement>(),
    beforeContentFocusGuardRef: React.createRef<HTMLElement>(),
    onOpenChangeComplete: undefined,
    triggerElements,
  };
}

function createInitialState<Payload>(
  triggerElements: PopupTriggerMap,
  floatingId?: string | undefined,
  nested = false,
  initialState?: Partial<State<Payload>>,
): State<Payload> {
  return {
    ...createInitialPopupStoreState<Payload>(triggerElements, floatingId, nested),
    disabled: false,
    modal: true,
    openMethod: null,
    keyboardOpen: false,
    allowMouseEnter: false,
    highlightItemOnHover: true,
    parent: {
      type: undefined,
    },
    rootId: undefined,
    activeIndex: null,
    listElement: null,
    filterTriggerProps: EMPTY_OBJECT,
    inputProps: EMPTY_OBJECT,
    focusedInput: null,
    highlightedItem: undefined,
    hoverEnabled: true,
    instantType: undefined,
    openChangeReason: null,
    floatingTreeRoot: new FloatingTreeStore(),
    floatingNodeId: undefined,
    floatingParentNodeId: null,
    itemProps: EMPTY_OBJECT,
    keyboardEventRelay: undefined,
    closeDelay: 0,
    adaptiveOrigin: undefined,
    ...initialState,
  };
}
