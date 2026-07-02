import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui/utils/store';
import { EMPTY_OBJECT, NOOP } from '@base-ui/utils/empty';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { MenuParent, MenuRoot } from '../root/MenuRoot';
import { FloatingTreeStore } from '../../floating-ui-react/components/FloatingTreeStore';
import { HTMLProps } from '../../internals/types';
import { NullStore } from '../../utils/NullStore';
import {
  createInitialPopupStoreState,
  PopupStoreContext,
  popupStoreSelectors,
  PopupStoreState,
  PopupTriggerMap,
  type PopupTriggerStoreKeys,
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
  constructor(initialState?: Partial<State<Payload>>) {
    super({ ...createInitialState(), ...initialState }, createInitialContext(), selectors);

    // Set up propagation of state from parent menu if applicable.
    this.unsubscribeParentListener = this.observe('parent', (parent) => {
      this.unsubscribeParentListener?.();

      if (parent.type === 'menu') {
        let rootId = parent.store.select('rootId');
        let floatingTreeRoot = parent.store.select('floatingTreeRoot');
        let keyboardEventRelay = parent.store.select('keyboardEventRelay');

        this.unsubscribeParentListener = parent.store.subscribe(() => {
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
      }

      this.unsubscribeParentListener = null;
    });
  }

  setOpen(open: boolean, eventDetails: Omit<MenuRoot.ChangeEventDetails, 'preventUnmountOnClose'>) {
    this.state.floatingRootContext.context.events.emit('setOpen', { open, eventDetails });
  }

  private unsubscribeParentListener: (() => void) | null = null;
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no `Menu.Root` is
 * attached. It preserves a menu-specific trigger registry in context so detached triggers can
 * register before migrating to the live root store. `setOpen` is a no-op (matching the inert
 * reads/writes of `NullStore`), so a trigger can hand the store to focus-guard helpers that expect
 * `setOpen` without it ever taking effect while detached.
 */
export function createNullMenuStore<Payload>(): MenuHandleStore<Payload> {
  const store = new NullStore<Readonly<State<Payload>>, Context, Selectors>(
    Object.freeze(createInitialState<Payload>()),
    Object.freeze(createInitialContext()),
    selectors,
  );
  return Object.assign(store, { setOpen: NOOP });
}

function createInitialContext(): Context {
  return {
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
