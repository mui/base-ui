/* eslint-disable react-hooks/rules-of-hooks */
'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ReactStore, createSelector } from '@base-ui/utils/store';
import { Timeout } from '@base-ui/utils/useTimeout';
import { type InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useId } from '@base-ui/utils/useId';
import { isElement } from '@floating-ui/utils/dom';
import { type PopoverRoot } from '../root/PopoverRoot';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import {
  createInitialPopupStoreStateBase,
  PopupStoreContext,
  popupStoreSelectors,
  PopupStoreStateBase,
  PopupTriggerMap,
  setPopupOpenState,
} from '../../utils/popups';
import { PATIENT_CLICK_THRESHOLD } from '../../internals/constants';
import {
  useFloatingParentNodeId,
  type ContextData,
  type FloatingEvents,
  type FloatingRootContext,
} from '../../floating-ui-react';
import { createEventEmitter } from '../../floating-ui-react/utils/createEventEmitter';
import {
  dispatchFloatingOpenChange,
  type FloatingRootState,
  syncFloatingOpenEvent,
} from '../../floating-ui-react/components/FloatingRootStore';

type PopoverFloatingState = Pick<
  FloatingRootState,
  'domReferenceElement' | 'floatingElement' | 'positionReference' | 'referenceElement'
>;

export type State<Payload> = PopupStoreStateBase<Payload> &
  PopoverFloatingState & {
    disabled: boolean;
    instantType: 'dismiss' | 'click' | 'focus' | 'trigger-change' | undefined;
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
  readonly dataRef: React.RefObject<ContextData>;
  readonly events: FloatingEvents;
  nested: boolean;
  readonly popupRef: React.RefObject<HTMLElement | null>;
  readonly backdropRef: React.RefObject<HTMLDivElement | null>;
  readonly internalBackdropRef: React.RefObject<HTMLDivElement | null>;
  readonly triggerFocusTargetRef: React.RefObject<HTMLElement | null>;
  readonly beforeContentFocusGuardRef: React.RefObject<HTMLElement | null>;
  readonly stickIfOpenTimeout: Timeout;
};

function createInitialState<Payload>(): State<Payload> {
  return {
    ...createInitialPopupStoreStateBase(),
    disabled: false,
    modal: false,
    focusManagerModal: false,
    instantType: undefined,
    openMethod: null,
    openChangeReason: null,
    referenceElement: null,
    domReferenceElement: null,
    floatingElement: null,
    positionReference: null,
    titleElementId: undefined,
    descriptionElementId: undefined,
    stickIfOpen: true,
    nested: false,
    openOnHover: false,
    closeDelay: 0,
    hasViewport: false,
  };
}

function getBaseReferenceElement(state: State<unknown>) {
  return state.referenceElement ?? (state.mounted ? state.activeTriggerElement : null);
}

function getDomReferenceElement(state: State<unknown>) {
  if (state.domReferenceElement) {
    return state.domReferenceElement;
  }

  const referenceElement = getBaseReferenceElement(state);
  return isElement(referenceElement) ? referenceElement : null;
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
  floatingId: createSelector((state: State<unknown>) => state.floatingId),
  referenceElement: createSelector(
    (state: State<unknown>) => state.positionReference ?? getBaseReferenceElement(state),
  ),
  domReferenceElement: createSelector(getDomReferenceElement),
  floatingElement: createSelector(
    (state: State<unknown>) => state.floatingElement ?? state.positionerElement,
  ),
  positionReference: createSelector((state: State<unknown>) => state.positionReference),
};

export class PopoverStore<Payload>
  extends ReactStore<Readonly<State<Payload>>, Context, Selectors>
  implements FloatingRootContext
{
  constructor(
    initialState?: Partial<State<Payload>>,
    floatingId?: string | undefined,
    nested = false,
  ) {
    const initial = { ...createInitialState<Payload>(), ...initialState };
    const triggerElements = new PopupTriggerMap();

    if (initial.open && initialState?.mounted === undefined) {
      initial.mounted = true;
    }

    initial.floatingId = floatingId;

    super(
      initial,
      {
        dataRef: { current: {} },
        events: createEventEmitter(),
        nested,
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

  syncOpenEvent = (newOpen: boolean, event: Event | undefined) => {
    syncFloatingOpenEvent(this.context, this.select('open'), newOpen, event);
  };

  dispatchOpenChange = (newOpen: boolean, eventDetails: BaseUIChangeEventDetails<string>) => {
    dispatchFloatingOpenChange(this.context, this.select('open'), newOpen, eventDetails);
  };

  set<T>(key: keyof State<Payload>, value: T) {
    super.set(key, this.getNormalizedValue(key, value));
  }

  update(changes: Partial<Readonly<State<Payload>>>) {
    super.update(this.getNormalizedChanges(changes));
  }

  setState(newState: Readonly<State<Payload>>) {
    super.setState(this.getNormalizedChanges(newState) as Readonly<State<Payload>>);
  }

  private getNormalizedChanges(changes: Partial<Readonly<State<Payload>>>) {
    let normalizedChanges: Partial<State<Payload>> | undefined;

    for (const key of Object.keys(changes) as Array<keyof State<Payload>>) {
      const value = changes[key];
      const normalizedValue = this.getNormalizedValue(key, value);

      if (!Object.is(value, normalizedValue)) {
        normalizedChanges ??= { ...changes } as Partial<State<Payload>>;
        (normalizedChanges as Record<keyof State<Payload>, unknown>)[key] = normalizedValue;
      }
    }

    return (normalizedChanges ?? changes) as Partial<State<Payload>>;
  }

  private getNormalizedValue<Key extends keyof State<Payload>>(key: Key, value: unknown) {
    switch (key) {
      case 'referenceElement':
        return (
          value == null || Object.is(value, this.getPopupReferenceElement()) ? null : value
        ) as State<Payload>[Key];
      case 'domReferenceElement':
        return (
          value == null || Object.is(value, this.getPopupDomReferenceElement()) ? null : value
        ) as State<Payload>[Key];
      case 'floatingElement':
        return (
          value == null || Object.is(value, this.getPopupFloatingElement()) ? null : value
        ) as State<Payload>[Key];
      default:
        return value;
    }
  }

  private getPopupReferenceElement() {
    if (!this.state.mounted) {
      return null;
    }

    const activeTriggerId = this.select('activeTriggerId');
    const triggerElement =
      activeTriggerId == null ? undefined : this.context.triggerElements.getById(activeTriggerId);

    return triggerElement ?? this.state.activeTriggerElement;
  }

  private getPopupDomReferenceElement() {
    const referenceElement = this.getPopupReferenceElement();
    return isElement(referenceElement) ? referenceElement : null;
  }

  private getPopupFloatingElement() {
    return this.state.positionerElement;
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

    const activeTriggerId = this.select('activeTriggerId');

    if (
      !nextOpen &&
      eventDetails.reason === REASONS.closePress &&
      eventDetails.trigger == null &&
      activeTriggerId != null
    ) {
      eventDetails.trigger =
        this.context.triggerElements.getById(activeTriggerId) ??
        this.select('activeTriggerElement') ??
        undefined;
    }

    this.context.onOpenChange?.(nextOpen, eventDetails as PopoverRoot.ChangeEventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    this.dispatchOpenChange(nextOpen, eventDetails);

    const changeState = () => {
      const updatedState: Partial<State<Payload>> = {
        open: nextOpen,
        openChangeReason: eventDetails.reason,
      };

      setPopupOpenState(updatedState, nextOpen, eventDetails.trigger);

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
    const floatingId = useId();
    const nested = useFloatingParentNodeId() != null;

    const internalStoreRef = React.useRef<PopoverStore<Payload> | null>(null);
    if (externalStore === undefined && internalStoreRef.current === null) {
      internalStoreRef.current = new PopoverStore<Payload>(initialState, floatingId, nested);
    }

    const store = externalStore ?? internalStoreRef.current!;
    const internalStore = internalStoreRef.current;

    store.context.nested = nested;
    store.useSyncedValue('floatingId', floatingId);

    React.useEffect(() => internalStore?.disposeEffect(), [internalStore]);
    return store;
  }

  private disposeEffect = () => {
    return this.context.stickIfOpenTimeout.disposeEffect();
  };
}

type Selectors = typeof selectors;
