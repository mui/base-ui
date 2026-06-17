'use client';
import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui/utils/store';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { MenuParent, MenuRoot } from '../root/MenuRoot';
import { FloatingTreeStore } from '../../floating-ui-react/components/FloatingTreeStore';
import { HTMLProps } from '../../internals/types';
import {
  createInitialPopupStoreState,
  PopupStoreContext,
  popupStoreSelectors,
  PopupStoreState,
  PopupTriggerMap,
} from '../../utils/popups';

export type State<Payload> = PopupStoreState<Payload> & {
  disabled: boolean;
  modal: boolean;
  openMethod: InteractionType | null;
  allowMouseEnter: boolean;
  highlightItemOnHover: boolean;
  parent: MenuParent;
  rootId: string | undefined;
  activeIndex: number | null;
  hoverEnabled: boolean;
  stickIfOpen: boolean;
  instantType: 'dismiss' | 'click' | 'group' | 'trigger-change' | undefined;
  openChangeReason: MenuRoot.ChangeEventReason | null;
  floatingTreeRoot: FloatingTreeStore;
  floatingNodeId: string | undefined;
  floatingParentNodeId: string | null;
  itemProps: HTMLProps;
  closeDelay: number;
  keyboardEventRelay: ((event: React.KeyboardEvent<any>) => void) | undefined;
  hasViewport: boolean;
};

type Context = PopupStoreContext<MenuRoot.ChangeEventDetails> & {
  readonly positionerRef: React.RefObject<HTMLElement | null>;
  readonly popupRef: React.RefObject<HTMLElement | null>;
  readonly typingRef: React.RefObject<boolean>;
  readonly itemDomElements: React.RefObject<(HTMLElement | null)[]>;
  readonly itemLabels: React.RefObject<(string | null)[]>;
  allowMouseUpTriggerRef: React.RefObject<boolean>;
  readonly triggerFocusTargetRef: React.RefObject<HTMLElement | null>;
  readonly beforeContentFocusGuardRef: React.RefObject<HTMLElement | null>;
};

const selectors = {
  ...popupStoreSelectors,
  disabled: createSelector((state: State<unknown>) =>
    state.parent.type === 'menubar'
      ? state.parent.context.disabled || state.disabled
      : state.disabled,
  ),
  modal: createSelector(
    (state: State<unknown>) =>
      (state.parent.type === undefined || state.parent.type === 'context-menu') &&
      (state.modal ?? true),
  ),
  openMethod: createSelector((state: State<unknown>) => state.openMethod),

  allowMouseEnter: createSelector((state: State<unknown>) => state.allowMouseEnter),
  highlightItemOnHover: createSelector((state: State<unknown>) => state.highlightItemOnHover),
  stickIfOpen: createSelector((state: State<unknown>) => state.stickIfOpen),
  parent: createSelector((state: State<unknown>) => state.parent),
  rootId: createSelector((state: State<unknown>): string | undefined => {
    if (state.parent.type === 'menu') {
      return state.parent.store.select('rootId');
    }

    return state.parent.type !== undefined ? state.parent.context.rootId : state.rootId;
  }),
  activeIndex: createSelector((state: State<unknown>) => state.activeIndex),
  isActive: createSelector(
    (state: State<unknown>, itemIndex: number) => state.activeIndex === itemIndex,
  ),
  hoverEnabled: createSelector((state: State<unknown>) => state.hoverEnabled),
  instantType: createSelector((state: State<unknown>) => state.instantType),
  lastOpenChangeReason: createSelector((state: State<unknown>) => state.openChangeReason),
  floatingTreeRoot: createSelector((state: State<unknown>): FloatingTreeStore => {
    if (state.parent.type === 'menu') {
      return state.parent.store.select('floatingTreeRoot');
    }

    return state.floatingTreeRoot;
  }),
  floatingNodeId: createSelector((state: State<unknown>) => state.floatingNodeId),
  floatingParentNodeId: createSelector((state: State<unknown>) => state.floatingParentNodeId),
  itemProps: createSelector((state: State<unknown>) => state.itemProps),
  closeDelay: createSelector((state: State<unknown>) => state.closeDelay),
  hasViewport: createSelector((state: State<unknown>) => state.hasViewport),
  keyboardEventRelay: createSelector(
    (state: State<unknown>): React.KeyboardEventHandler<any> | undefined => {
      if (state.keyboardEventRelay) {
        return state.keyboardEventRelay;
      }

      if (state.parent.type === 'menu') {
        return state.parent.store.select('keyboardEventRelay');
      }

      return undefined;
    },
  ),
};

export class MenuStore<Payload> extends ReactStore<
  Readonly<State<Payload>>,
  Context,
  typeof selectors
> {
  constructor(initialState?: Partial<State<Payload>>) {
    super(
      { ...createInitialState(), ...initialState },
      {
        positionerRef: React.createRef<HTMLElement | null>(),
        popupRef: React.createRef<HTMLElement | null>(),
        typingRef: { current: false },
        itemDomElements: { current: [] },
        itemLabels: { current: [] },
        allowMouseUpTriggerRef: { current: false },
        triggerFocusTargetRef: React.createRef<HTMLElement>(),
        beforeContentFocusGuardRef: React.createRef<HTMLElement>(),
        onOpenChangeComplete: undefined,
        triggerElements: new PopupTriggerMap(),
      },
      selectors,
    );

    // This menu's own mouse-up gate, used when it has no parent to borrow from.
    this.ownAllowMouseUpTriggerRef = this.context.allowMouseUpTriggerRef;

    // Wire up parent-state propagation. External (`handle`) stores never run the effect in
    // `useStore`, so they rely on this constructor-time setup; internal stores re-arm it from the
    // effect (see `connectEffect`) so the subscription survives StrictMode remounts and `handle`
    // prop toggles.
    this.connectParentObserver();
  }

  setOpen(open: boolean, eventDetails: Omit<MenuRoot.ChangeEventDetails, 'preventUnmountOnClose'>) {
    this.state.floatingRootContext.context.events.emit('setOpen', { open, eventDetails });
  }

  public static useStore<Payload>(
    externalStore: MenuStore<Payload> | undefined,
    initialState: Partial<State<Payload>>,
  ) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const internalStore = useRefWithInit(() => {
      return new MenuStore<Payload>(initialState);
    }).current;

    // Only the internally-created store is owned by this component. An external `handle` store is
    // owned by the consumer and may outlive the menu, so it must not be connected/disposed here.
    // The internal store re-arms its parent observer on every mount and tears it down on every
    // unmount, keeping the lifecycle symmetric: a one-time constructor setup would be permanently
    // severed by the first effect cleanup (a StrictMode remount, or the `handle` prop toggling
    // defined → undefined → defined), leaving the submenu unable to react to parent changes.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(
      () => (externalStore ? undefined : internalStore.connectEffect()),
      [externalStore, internalStore],
    );

    return externalStore ?? internalStore;
  }

  // This menu's own mouse-up gate, captured before any parent ref is borrowed so the root branch of
  // `connectParentObserver` can restore it.
  private ownAllowMouseUpTriggerRef: React.RefObject<boolean>;

  private unsubscribeParentStore: (() => void) | null = null;

  private unsubscribeParentObserver: (() => void) | null = null;

  // (Re-)establishes the observer that propagates parent-menu state. Idempotent: any existing
  // observer/subscription is torn down first, so calling it again (e.g. from the mount effect after
  // a StrictMode unmount/remount) never double-subscribes.
  //
  // `observe` fires the listener synchronously here and again on every `parent` change. The
  // observer's own unsubscriber (`unsubscribeParentObserver`) and the per-parent store subscription
  // (`unsubscribeParentStore`) live in separate fields so re-running the listener only tears down
  // the previous parent's subscription, never the observer itself.
  private connectParentObserver() {
    this.disconnectParentObserver();

    this.unsubscribeParentObserver = this.observe('parent', (parent) => {
      this.unsubscribeParentStore?.();
      this.unsubscribeParentStore = null;

      if (parent.type === 'menu') {
        let rootId = parent.store.select('rootId');
        let floatingTreeRoot = parent.store.select('floatingTreeRoot');
        let keyboardEventRelay = parent.store.select('keyboardEventRelay');

        this.unsubscribeParentStore = parent.store.subscribe(() => {
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

        this.context.allowMouseUpTriggerRef = parent.store.context.allowMouseUpTriggerRef;
        return;
      }

      if (parent.type !== undefined) {
        this.context.allowMouseUpTriggerRef = parent.context.allowMouseUpTriggerRef;
        return;
      }

      // Back at the root: stop borrowing a parent's ref so mouse-up state stays isolated.
      this.context.allowMouseUpTriggerRef = this.ownAllowMouseUpTriggerRef;
    });
  }

  // Tears down the parent observer and any per-parent subscription this store created. Releasing
  // `unsubscribeParentStore` is essential: a submenu's store subscribes into the parent menu's
  // store, so without this the parent's listener set keeps the child store referenced after it
  // unmounts, leaking the child store on every open/close cycle.
  private disconnectParentObserver() {
    this.unsubscribeParentStore?.();
    this.unsubscribeParentStore = null;
    this.unsubscribeParentObserver?.();
    this.unsubscribeParentObserver = null;
  }

  // Effect body for internally-owned stores: re-arm the parent observer on mount, tear it down on
  // unmount. Symmetric setup/teardown is what keeps the subscription alive across StrictMode
  // remounts and `handle` toggles (see the comment in `useStore`).
  private connectEffect = () => {
    this.connectParentObserver();
    return () => this.disconnectParentObserver();
  };
}

function createInitialState<Payload>(): State<Payload> {
  return {
    ...createInitialPopupStoreState(),
    disabled: false,
    modal: true,
    openMethod: null,
    allowMouseEnter: false,
    highlightItemOnHover: true,
    stickIfOpen: true,
    parent: {
      type: undefined,
    },
    rootId: undefined,
    activeIndex: null,
    hoverEnabled: true,
    instantType: undefined,
    openChangeReason: null,
    floatingTreeRoot: new FloatingTreeStore(),
    floatingNodeId: undefined,
    floatingParentNodeId: null,
    itemProps: EMPTY_OBJECT as HTMLProps,
    keyboardEventRelay: undefined,
    closeDelay: 0,
    hasViewport: false,
  };
}
