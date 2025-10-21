import * as React from 'react';
import { ReactStore } from '@base-ui-components/utils/store';
import { EMPTY_OBJECT } from '@base-ui-components/utils/empty';
import { MenuParent, MenuRoot } from '../root/MenuRoot';
import { FloatingRootContext } from '../../floating-ui-react';
import { getEmptyContext } from '../../floating-ui-react/hooks/useFloatingRootContext';
import { TransitionStatus } from '../../utils/useTransitionStatus';
import { HTMLProps } from '../../utils/types';

export type State = {
  open: boolean;
  disabled: boolean;
  modal: boolean;
  mounted: boolean;
  allowMouseEnter: boolean;
  parent: MenuParent;
  rootId: string | undefined;
  activeIndex: number | null;
  hoverEnabled: boolean;
  triggerElement: HTMLElement | null;
  positionerElement: HTMLElement | null;
  transitionStatus: TransitionStatus;
  instantType: 'dismiss' | 'click' | 'group' | undefined;
  lastOpenChangeReason: MenuRoot.ChangeEventReason | null;
  floatingRootContext: FloatingRootContext;
  itemProps: HTMLProps;
  popupProps: HTMLProps;
  triggerProps: HTMLProps;
};

type Context = {
  positionerRef: React.RefObject<HTMLElement | null>;
  popupRef: React.RefObject<HTMLElement | null>;
  typingRef: React.RefObject<boolean>;
  itemDomElements: React.RefObject<(HTMLElement | null)[]>;
  itemLabels: React.RefObject<(string | null)[]>;
  allowMouseUpTriggerRef: React.RefObject<boolean>;

  onOpenChangeComplete: ((open: boolean) => void) | undefined;
};

const selectors = {
  open: (state: State) => state.open,
  disabled: (state: State) =>
    state.parent.type === 'menubar' ? state.parent.context.disabled : state.disabled,

  modal: (state: State) =>
    (state.parent.type === undefined || state.parent.type === 'context-menu') &&
    (state.modal ?? true),

  mounted: (state: State) => state.mounted,
  allowMouseEnter: (state: State): boolean =>
    state.parent.type === 'menu'
      ? state.parent.context.select('allowMouseEnter')
      : state.allowMouseEnter,
  parent: (state: State) => state.parent,
  rootId: (state: State): string | undefined => {
    if (state.parent.type === 'menu') {
      return state.parent.context.select('rootId');
    }

    return state.parent.type !== undefined ? state.parent.context.rootId : state.rootId;
  },
  activeIndex: (state: State) => state.activeIndex,
  hoverEnabled: (state: State) => state.hoverEnabled,
  triggerElement: (state: State) => state.triggerElement,
  positionerElement: (state: State) => state.positionerElement,
  transitionStatus: (state: State) => state.transitionStatus,
  instantType: (state: State) => state.instantType,
  lastOpenChangeReason: (state: State) => state.lastOpenChangeReason,
  floatingRootContext: (state: State) => state.floatingRootContext,
  itemProps: (state: State) => state.itemProps,
  popupProps: (state: State) => state.popupProps,
  triggerProps: (state: State) => state.triggerProps,
};

const writeInterceptors = {
  allowMouseEnter: (value: boolean, store: ReactStore<State, Context, typeof selectors>) => {
    // If this menu is a submenu, it should inherit `allowMouseEnter` from its
    // parent. Otherwise it manages the state on its own.
    if (store.state.parent.type === 'menu') {
      store.state.parent.context.set('allowMouseEnter', value);
    }

    return value;
  },

  parent: (value: MenuParent, store: ReactStore<State, Context, typeof selectors>) => {
    registerParent(store, value);
    return value;
  },
};

function registerParent(store: ReactStore<any, Context, any>, parent: MenuParent) {
  if (parent.type === 'menu') {
    parent.context.subscribe(() => {
      // Propagate changes from parent menu
      store.notifyAll();
    });

    store.context.allowMouseUpTriggerRef = parent.context.context.allowMouseUpTriggerRef;
  } else if (parent.type !== undefined) {
    store.context.allowMouseUpTriggerRef = parent.context.allowMouseUpTriggerRef;
  }
}

export class MenuStore extends ReactStore<State, Context, typeof selectors> {
  constructor(initialState?: Partial<State>) {
    super(
      { ...createInitialState(), ...initialState },
      {
        positionerRef: React.createRef<HTMLElement | null>(),
        popupRef: React.createRef<HTMLElement | null>(),
        typingRef: { current: false },
        itemDomElements: { current: [] },
        itemLabels: { current: [] },
        allowMouseUpTriggerRef: { current: false },
        onOpenChangeComplete: undefined,
      },
      selectors,
      writeInterceptors,
    );

    if (initialState?.parent) {
      registerParent(this as any, initialState.parent);
    }
  }

  setOpen(open: boolean, eventDetails: Omit<MenuRoot.ChangeEventDetails, 'preventUnmountOnClose'>) {
    this.state.floatingRootContext.events.emit('setOpen', { open, eventDetails });
  }
}

function createInitialState(): State {
  return {
    open: false,
    disabled: false,
    modal: true,
    mounted: false,
    allowMouseEnter: true,
    parent: {
      type: undefined,
    },
    rootId: undefined,
    activeIndex: null,
    hoverEnabled: true,
    triggerElement: null,
    positionerElement: null,
    transitionStatus: 'idle',
    instantType: undefined,
    lastOpenChangeReason: null,
    floatingRootContext: getEmptyContext(),
    itemProps: EMPTY_OBJECT as HTMLProps,
    popupProps: EMPTY_OBJECT as HTMLProps,
    triggerProps: EMPTY_OBJECT as HTMLProps,
  };
}
