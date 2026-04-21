import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ReactStore, createSelector } from '@base-ui/utils/store';
import { useId } from '@base-ui/utils/useId';
import { Timeout } from '@base-ui/utils/useTimeout';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { type InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useFloatingParentNodeId, useSyncedFloatingRootContext } from '../../floating-ui-react';
import { PopoverRoot } from './../root/PopoverRoot';
import { REASONS } from '../../internals/reasons';
import {
  createPopupFloatingRootContext,
  createInitialPopupStoreState,
  type PopupFloatingRootContextOptions,
  PopupStoreContext,
  popupStoreSelectors,
  PopupStoreState,
  PopupTriggerMap,
} from '../../utils/popups';
import { PATIENT_CLICK_THRESHOLD } from '../../internals/constants';

export type State<Payload> = PopupStoreState<Payload> & {
  disabled: boolean;
  instantType: 'dismiss' | 'click' | undefined;
  modal: boolean | 'trap-focus';
  focusManagerModal: boolean;
  openMethod: InteractionType | null;
  openChangeReason: PopoverRoot.ChangeEventReason | null;
  stickIfOpen: boolean;
  nested: boolean;
  titleElementId: string | undefined;
  descriptionElementId: string | undefined;
  openOnHover: boolean;
  closeDelay: number;
  hasViewport: boolean;
};

type Context = PopupStoreContext<PopoverRoot.ChangeEventDetails> & {
  readonly popupRef: React.RefObject<HTMLElement | null>;
  readonly backdropRef: React.RefObject<HTMLDivElement | null>;
  readonly internalBackdropRef: React.RefObject<HTMLDivElement | null>;
  readonly triggerFocusTargetRef: React.RefObject<HTMLElement | null>;
  readonly beforeContentFocusGuardRef: React.RefObject<HTMLElement | null>;
  readonly stickIfOpenTimeout: Timeout;
};

function createInitialState<Payload>(): State<Payload> {
  return {
    ...createInitialPopupStoreState(),
    disabled: false,
    modal: false,
    focusManagerModal: false,
    instantType: undefined,
    openMethod: null,
    openChangeReason: null,
    titleElementId: undefined,
    descriptionElementId: undefined,
    stickIfOpen: true,
    nested: false,
    openOnHover: false,
    closeDelay: 0,
    hasViewport: false,
  };
}

const selectors = {
  ...popupStoreSelectors,
  disabled: createSelector((state: State<unknown>) => state.disabled),
  instantType: createSelector((state: State<unknown>) => state.instantType),
  openMethod: createSelector((state: State<unknown>) => state.openMethod),
  openChangeReason: createSelector((state: State<unknown>) => state.openChangeReason),
  modal: createSelector((state: State<unknown>) => state.modal),
  focusManagerModal: createSelector((state: State<unknown>) => state.focusManagerModal),
  stickIfOpen: createSelector((state: State<unknown>) => state.stickIfOpen),
  titleElementId: createSelector((state: State<unknown>) => state.titleElementId),
  descriptionElementId: createSelector((state: State<unknown>) => state.descriptionElementId),
  openOnHover: createSelector((state: State<unknown>) => state.openOnHover),
  closeDelay: createSelector((state: State<unknown>) => state.closeDelay),
  hasViewport: createSelector((state: State<unknown>) => state.hasViewport),
};

export class PopoverStore<Payload> extends ReactStore<
  Readonly<State<Payload>>,
  Context,
  Selectors
> {
  constructor(
    initialState?: Partial<State<Payload>>,
    floatingRootContextOptions?: PopupFloatingRootContextOptions,
  ) {
    const initial = { ...createInitialState<Payload>(), ...initialState };
    const triggerElements = new PopupTriggerMap();

    if (initial.open && initialState?.mounted === undefined) {
      initial.mounted = true;
    }

    initial.floatingRootContext = createPopupFloatingRootContext(
      triggerElements,
      floatingRootContextOptions,
    );

    super(
      initial,
      {
        popupRef: React.createRef<HTMLElement>(),
        backdropRef: React.createRef<HTMLDivElement>(),
        internalBackdropRef: React.createRef<HTMLDivElement>(),
        onOpenChange: undefined,
        onOpenChangeComplete: undefined,
        triggerFocusTargetRef: React.createRef<HTMLElement>(),
        beforeContentFocusGuardRef: React.createRef<HTMLElement>(),
        stickIfOpenTimeout: new Timeout(),
        triggerElements,
      },
      selectors,
    );
  }

  setOpen = (
    nextOpen: boolean,
    eventDetails: Omit<PopoverRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
  ) => {
    const isHover = eventDetails.reason === REASONS.triggerHover;
    const isKeyboardClick =
      eventDetails.reason === REASONS.triggerPress &&
      (eventDetails.event as MouseEvent).detail === 0;
    const isDismissClose =
      !nextOpen && (eventDetails.reason === REASONS.escapeKey || eventDetails.reason == null);

    (eventDetails as PopoverRoot.ChangeEventDetails).preventUnmountOnClose = () => {
      this.set('preventUnmountingOnClose', true);
    };

    this.context.onOpenChange?.(nextOpen, eventDetails as PopoverRoot.ChangeEventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    this.state.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);

    const changeState = () => {
      const updatedState: Partial<State<Payload>> = {
        open: nextOpen,
        openChangeReason: eventDetails.reason,
      };

      // If a popup is closing, the `trigger` may be null.
      // We want to keep the previous value so that exit animations are played and focus is returned correctly.
      const newTriggerId = eventDetails.trigger?.id ?? null;
      if (newTriggerId || nextOpen) {
        updatedState.activeTriggerId = newTriggerId;
        updatedState.activeTriggerElement = eventDetails.trigger ?? null;
      }

      this.update(updatedState);
    };

    if (isHover) {
      // Only allow "patient" clicks to close the popover if it's open.
      // If they clicked within 500ms of the popover opening, keep it open.
      this.set('stickIfOpen', true);
      this.context.stickIfOpenTimeout.start(PATIENT_CLICK_THRESHOLD, () => {
        this.set('stickIfOpen', false);
      });

      ReactDOM.flushSync(changeState);
    } else {
      changeState();
    }

    if (isKeyboardClick || isDismissClose) {
      this.set('instantType', isKeyboardClick ? 'click' : 'dismiss');
    } else if (eventDetails.reason === REASONS.focusOut) {
      this.set('instantType', 'focus');
    } else {
      this.set('instantType', undefined);
    }
  };

  public static useStore<Payload>(
    externalStore: PopoverStore<Payload> | undefined,
    initialState: Partial<State<Payload>>,
  ) {
    /* eslint-disable react-hooks/rules-of-hooks */
    const floatingId = useId();
    const nested = useFloatingParentNodeId() != null;

    const internalStore = useRefWithInit(() => {
      return new PopoverStore<Payload>(initialState, { floatingId, nested });
    }).current;

    const store = externalStore ?? internalStore;

    useSyncedFloatingRootContext({
      popupStore: store,
      floatingRootContext: store.state.floatingRootContext,
      floatingId,
      nested,
      onOpenChange: store.setOpen,
    });

    useOnMount(internalStore.disposeEffect);
    /* eslint-enable react-hooks/rules-of-hooks */

    return store;
  }

  private disposeEffect = () => {
    return this.context.stickIfOpenTimeout.disposeEffect();
  };
}

type Selectors = typeof selectors;
