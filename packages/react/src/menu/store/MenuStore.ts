import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui-components/utils/store';
import { EMPTY_OBJECT } from '@base-ui-components/utils/empty';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { MenuParent, MenuRoot } from '../root/MenuRoot';
import { type FloatingRootContext } from '../../floating-ui-react';
import { getEmptyRootContext } from '../../floating-ui-react/utils/getEmptyRootContext';
import { FloatingTreeStore } from '../../floating-ui-react/components/FloatingTreeStore';
import { TransitionStatus } from '../../utils/useTransitionStatus';
import { HTMLProps } from '../../utils/types';
import { PopupTriggerMap } from '../../utils/popupStoreUtils';

export type State<Payload> = {
  open: boolean;
  disabled: boolean;
  modal: boolean;
  mounted: boolean;
  allowMouseEnter: boolean;
  parent: MenuParent;
  rootId: string | undefined;
  activeIndex: number | null;
  hoverEnabled: boolean;
  stickIfOpen: boolean;
  positionerElement: HTMLElement | null;
  transitionStatus: TransitionStatus;
  instantType: 'dismiss' | 'click' | 'group' | undefined;
  lastOpenChangeReason: MenuRoot.ChangeEventReason | null;
  floatingRootContext: FloatingRootContext;
  floatingTreeRoot: FloatingTreeStore;
  floatingNodeId: string | undefined;
  floatingParentNodeId: string | null;
  itemProps: HTMLProps;
  popupProps: HTMLProps;
  payload: Payload | undefined;
  triggers: PopupTriggerMap;
  activeTriggerProps: HTMLProps;
  inactiveTriggerProps: HTMLProps;
  activeTriggerId: string | null;
  closeDelay: number;
  keyboardEventRelay: ((event: React.KeyboardEvent<any>) => void) | undefined;
};

type Context = {
  positionerRef: React.RefObject<HTMLElement | null>;
  popupRef: React.RefObject<HTMLElement | null>;
  typingRef: React.RefObject<boolean>;
  itemDomElements: React.RefObject<(HTMLElement | null)[]>;
  itemLabels: React.RefObject<(string | null)[]>;
  allowMouseUpTriggerRef: React.RefObject<boolean>;
  preventUnmountingRef: React.RefObject<boolean>;
  triggerFocusTargetRef: React.RefObject<HTMLElement | null>;
  beforeContentFocusGuardRef: React.RefObject<HTMLElement | null>;

  onOpenChangeComplete: ((open: boolean) => void) | undefined;
};

const selectors = {
  open: createSelector((state: State<unknown>) => state.open),
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

  mounted: createSelector((state: State<unknown>) => state.mounted),
  activeTriggerId: createSelector((state: State<unknown>) => state.activeTriggerId),
  activeTriggerElement: createSelector((state: State<unknown>) =>
    state.mounted && state.activeTriggerId != null
      ? (state.triggers.get(state.activeTriggerId) ?? null)
      : null,
  ),
  isTriggerActive: createSelector(
    (state: State<unknown>, triggerId: string | undefined) =>
      triggerId !== undefined && state.activeTriggerId === triggerId,
  ),
  isOpenedByTrigger: createSelector(
    (state: State<unknown>, triggerId: string | undefined) =>
      triggerId !== undefined && state.activeTriggerId === triggerId && state.open,
  ),
  allowMouseEnter: createSelector((state: State<unknown>): boolean =>
    state.parent.type === 'menu'
      ? state.parent.store.select('allowMouseEnter')
      : state.allowMouseEnter,
  ),
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
  positionerElement: createSelector((state: State<unknown>) => state.positionerElement),
  transitionStatus: createSelector((state: State<unknown>) => state.transitionStatus),
  instantType: createSelector((state: State<unknown>) => state.instantType),
  lastOpenChangeReason: createSelector((state: State<unknown>) => state.lastOpenChangeReason),
  floatingRootContext: createSelector((state: State<unknown>) => state.floatingRootContext),
  floatingTreeRoot: createSelector((state: State<unknown>): FloatingTreeStore => {
    if (state.parent.type === 'menu') {
      return state.parent.store.select('floatingTreeRoot');
    }

    return state.floatingTreeRoot;
  }),
  floatingNodeId: createSelector((state: State<unknown>) => state.floatingNodeId),
  floatingParentNodeId: createSelector((state: State<unknown>) => state.floatingParentNodeId),
  itemProps: createSelector((state: State<unknown>) => state.itemProps),
  popupProps: createSelector((state: State<unknown>) => state.popupProps),
  activeTriggerProps: createSelector((state: State<unknown>) => state.activeTriggerProps),
  inactiveTriggerProps: createSelector((state: State<unknown>) => state.inactiveTriggerProps),
  payload: createSelector((state: State<unknown>) => state.payload),
  triggers: createSelector((state: State<unknown>) => state.triggers),
  closeDelay: createSelector((state: State<unknown>) => state.closeDelay),
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

export class MenuStore<Payload> extends ReactStore<State<Payload>, Context, typeof selectors> {
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
        preventUnmountingRef: { current: false },
        triggerFocusTargetRef: React.createRef<HTMLElement>(),
        beforeContentFocusGuardRef: React.createRef<HTMLElement>(),
        onOpenChangeComplete: undefined,
      },
      selectors,
    );

    // Sync `allowMouseEnter` with parent menu if applicable.
    this.observe(
      createSelector((state) => state.allowMouseEnter),
      (allowMouseEnter, oldValue) => {
        // The allowMouseEnter !== oldValue check prevent calling parent store's set
        // on intialization. Without it, React might complain about updating one component during rendering another.
        if (this.state.parent.type === 'menu' && allowMouseEnter !== oldValue) {
          this.state.parent.store.set('allowMouseEnter', allowMouseEnter);
        }
      },
    );

    // Set up propagation of state from parent menu if applicable.
    this.unsubscribeParentListener = this.observe('parent', (parent) => {
      this.unsubscribeParentListener?.();

      if (parent.type === 'menu') {
        this.unsubscribeParentListener = parent.store.subscribe(() => {
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
    this.state.floatingRootContext.events.emit('setOpen', { open, eventDetails });
  }

  public static useStore<Payload>(
    externalStore: MenuStore<Payload> | undefined,
    initialState: Partial<State<Payload>>,
  ) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const store = useRefWithInit(() => {
      return externalStore ?? new MenuStore<Payload>(initialState);
    }).current;

    return store;
  }

  private unsubscribeParentListener: (() => void) | null = null;
}

function createInitialState<Payload>(): State<Payload> {
  return {
    open: false,
    disabled: false,
    modal: true,
    mounted: false,
    allowMouseEnter: true,
    stickIfOpen: true,
    parent: {
      type: undefined,
    },
    rootId: undefined,
    activeIndex: null,
    hoverEnabled: true,
    positionerElement: null,
    transitionStatus: 'idle',
    instantType: undefined,
    lastOpenChangeReason: null,
    floatingRootContext: getEmptyRootContext(),
    floatingTreeRoot: new FloatingTreeStore(),
    floatingNodeId: undefined,
    floatingParentNodeId: null,
    itemProps: EMPTY_OBJECT as HTMLProps,
    popupProps: EMPTY_OBJECT as HTMLProps,
    activeTriggerProps: EMPTY_OBJECT as HTMLProps,
    inactiveTriggerProps: EMPTY_OBJECT as HTMLProps,
    payload: undefined,
    triggers: new Map<string, HTMLElement>(),
    activeTriggerId: null,
    keyboardEventRelay: undefined,
    closeDelay: 0,
  };
}
