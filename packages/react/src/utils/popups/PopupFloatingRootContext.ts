/* False positives - ESLint thinks we're calling hooks from a class component. */
/* eslint-disable react-hooks/rules-of-hooks */
'use client';
import * as React from 'react';
import { ReactStore, useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { isElement } from '@floating-ui/utils/dom';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import {
  dispatchFloatingOpenChange,
  floatingRootStoreSelectors,
  type FloatingRootState,
  type FloatingRootStoreContext,
  syncFloatingOpenEvent,
} from '../../floating-ui-react/components/FloatingRootStore';
import type { FloatingRootContext, ReferenceType } from '../../floating-ui-react/types';
import { createEventEmitter } from '../../floating-ui-react/utils/createEventEmitter';
import type { PopupStoreContext, PopupStoreSelectors, PopupStoreStateBase } from './store';

type PopupStore<
  State extends PopupStoreStateBase<unknown>,
  ContextEventDetails extends BaseUIChangeEventDetails<string>,
> = ReactStore<State, PopupStoreContext<ContextEventDetails>, PopupStoreSelectors>;

type Listener = (state: Readonly<FloatingRootState>) => void;

export interface PopupFloatingResolvers<
  State extends PopupStoreStateBase<unknown>,
  ContextEventDetails extends BaseUIChangeEventDetails<string>,
> {
  resolveReference?:
    | ((popupStore: PopupStore<State, ContextEventDetails>) => ReferenceType | null)
    | undefined;
  resolveFloating?:
    | ((popupStore: PopupStore<State, ContextEventDetails>) => HTMLElement | null)
    | undefined;
  resolveDomReference?:
    | ((
        referenceElement: ReferenceType | null,
        popupStore: PopupStore<State, ContextEventDetails>,
      ) => Element | null)
    | undefined;
}

export interface PopupFloatingRootContextOptions<
  State extends PopupStoreStateBase<unknown>,
  ContextEventDetails extends BaseUIChangeEventDetails<string>,
> extends PopupFloatingResolvers<State, ContextEventDetails> {
  popupStore: PopupStore<State, ContextEventDetails>;
  nested: boolean;
  treatPopupAsFloatingElement?: boolean | undefined;
  onOpenChange:
    | ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void)
    | undefined;
}

interface LocalState {
  referenceElement: ReferenceType | null | undefined;
  domReferenceElement: Element | null | undefined;
  floatingElement: HTMLElement | null | undefined;
  positionReference: ReferenceType | null;
}

function defaultResolveReference(popupStore: {
  state: { mounted: boolean; activeTriggerElement: Element | null };
  select(key: 'activeTriggerId'): string | null;
  context: { triggerElements: { getById(id: string): Element | undefined } };
}): ReferenceType | null {
  if (!popupStore.state.mounted) {
    return null;
  }

  const activeTriggerId = popupStore.select('activeTriggerId');
  const triggerElement =
    activeTriggerId == null
      ? undefined
      : popupStore.context.triggerElements.getById(activeTriggerId);

  return triggerElement ?? popupStore.state.activeTriggerElement;
}

function defaultResolveDomReference(referenceElement: ReferenceType | null) {
  return isElement(referenceElement) ? referenceElement : null;
}

export class PopupFloatingRootContext<
  State extends PopupStoreStateBase<unknown>,
  ContextEventDetails extends BaseUIChangeEventDetails<string>,
> implements FloatingRootContext {
  constructor(options: PopupFloatingRootContextOptions<State, ContextEventDetails>) {
    const {
      popupStore,
      nested,
      treatPopupAsFloatingElement = false,
      onOpenChange,
      resolveReference,
      resolveFloating,
      resolveDomReference,
    } = options;

    this.popupStore = popupStore;
    this.resolveReferenceOption = resolveReference ?? defaultResolveReference;
    this.resolveFloatingOption =
      resolveFloating ??
      ((store) =>
        treatPopupAsFloatingElement ? store.state.popupElement : store.state.positionerElement);
    this.resolveDomReferenceOption = resolveDomReference ?? defaultResolveDomReference;

    this.context = {
      onOpenChange,
      dataRef: { current: {} },
      events: createEventEmitter(),
      nested,
      triggerElements: popupStore.context.triggerElements,
    };

    this.snapshot = this.createSnapshot();

    popupStore.subscribe(() => {
      this.refreshSnapshot();
    });
  }

  readonly context: FloatingRootStoreContext;

  private readonly popupStore: PopupStore<State, ContextEventDetails>;

  private readonly resolveReferenceOption: NonNullable<
    PopupFloatingResolvers<State, ContextEventDetails>['resolveReference']
  >;

  private readonly resolveFloatingOption: NonNullable<
    PopupFloatingResolvers<State, ContextEventDetails>['resolveFloating']
  >;

  private readonly resolveDomReferenceOption: NonNullable<
    PopupFloatingResolvers<State, ContextEventDetails>['resolveDomReference']
  >;

  private readonly listeners = new Set<Listener>();

  private snapshot: Readonly<FloatingRootState>;

  private localState: LocalState = {
    referenceElement: undefined,
    domReferenceElement: undefined,
    floatingElement: undefined,
    positionReference: null,
  };

  get state() {
    return this.snapshot;
  }

  getSnapshot = () => {
    return this.snapshot;
  };

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  setOptions(options: { nested: boolean }, notify = true) {
    if (this.context.nested === options.nested) {
      return;
    }

    this.context.nested = options.nested;

    if (notify) {
      this.refreshSnapshot();
    }
  }

  syncOpenEvent = (newOpen: boolean, event: Event | undefined) => {
    syncFloatingOpenEvent(this.context, this.state.open, newOpen, event);
  };

  dispatchOpenChange = (newOpen: boolean, eventDetails: BaseUIChangeEventDetails<string>) => {
    dispatchFloatingOpenChange(this.context, this.state.open, newOpen, eventDetails);
  };

  setOpen = (newOpen: boolean, eventDetails: BaseUIChangeEventDetails<string>) => {
    this.context.onOpenChange?.(newOpen, eventDetails);
  };

  setState(newState: FloatingRootState) {
    this.update(newState);
  }

  update(changes: Partial<FloatingRootState>) {
    let didChange = false;

    (Object.keys(changes) as Array<keyof FloatingRootState>).forEach((key) => {
      if (this.setLocalValue(key, changes[key])) {
        didChange = true;
      }
    });

    if (didChange) {
      this.refreshSnapshot();
    }
  }

  set<T>(key: keyof FloatingRootState, value: T) {
    if (this.setLocalValue(key, value)) {
      this.refreshSnapshot();
    }
  }

  select<Key extends keyof typeof floatingRootStoreSelectors>(
    key: Key,
    ...args: any[]
  ): ReturnType<(typeof floatingRootStoreSelectors)[Key]> {
    const selector = floatingRootStoreSelectors[key] as (
      state: FloatingRootState,
      ...a: any[]
    ) => any;
    return selector(this.snapshot, args[0], args[1], args[2]);
  }

  useState<Key extends keyof typeof floatingRootStoreSelectors>(
    key: Key,
    ...args: any[]
  ): ReturnType<(typeof floatingRootStoreSelectors)[Key]> {
    React.useDebugValue(key);
    return useStore(this, floatingRootStoreSelectors[key] as any, args[0], args[1], args[2]);
  }

  useSyncedValue<Key extends keyof FloatingRootState>(key: Key, value: FloatingRootState[Key]) {
    React.useDebugValue(key);
    // eslint-disable-next-line consistent-this
    const store = this;
    useIsoLayoutEffect(() => {
      store.set(key, value);
    }, [store, key, value]);
  }

  private setLocalValue(key: keyof FloatingRootState, value: unknown) {
    switch (key) {
      case 'referenceElement':
        return this.setLocalState(
          'referenceElement',
          value == null || Object.is(value, this.resolveReference())
            ? undefined
            : (value as ReferenceType),
        );
      case 'domReferenceElement':
        return this.setLocalState(
          'domReferenceElement',
          value == null || Object.is(value, this.resolveDomReference())
            ? undefined
            : (value as Element),
        );
      case 'floatingElement':
        return this.setLocalState(
          'floatingElement',
          value == null || Object.is(value, this.resolveFloating())
            ? undefined
            : (value as HTMLElement),
        );
      case 'positionReference':
        return this.setLocalState('positionReference', (value ?? null) as ReferenceType | null);
      case 'floatingId':
        if (!Object.is(this.popupStore.state.floatingId, value)) {
          this.popupStore.set('floatingId', value as State['floatingId']);
        }
        return false;
      case 'transitionStatus':
        if (!Object.is(this.popupStore.state.transitionStatus, value)) {
          this.popupStore.set('transitionStatus', value as State['transitionStatus']);
        }
        return false;
      case 'open':
        if (!Object.is(this.popupStore.state.open, value)) {
          this.popupStore.set('open', value as State['open']);
        }
        return false;
      default:
        return false;
    }
  }

  private setLocalState<Key extends keyof LocalState>(key: Key, value: LocalState[Key]) {
    if (Object.is(this.localState[key], value)) {
      return false;
    }

    this.localState = { ...this.localState, [key]: value };
    return true;
  }

  private resolveReference() {
    return this.resolveReferenceOption(this.popupStore);
  }

  private resolveFloating() {
    return this.resolveFloatingOption(this.popupStore);
  }

  private resolveDomReference(referenceElement: ReferenceType | null = this.resolveReference()) {
    return this.resolveDomReferenceOption(referenceElement, this.popupStore);
  }

  private createSnapshot(): Readonly<FloatingRootState> {
    const rawState = this.popupStore.state;

    const referenceElement =
      this.localState.referenceElement === undefined
        ? this.resolveReference()
        : this.localState.referenceElement;
    const floatingElement =
      this.localState.floatingElement === undefined
        ? this.resolveFloating()
        : this.localState.floatingElement;
    const domReferenceElement =
      this.localState.domReferenceElement === undefined
        ? this.resolveDomReference(referenceElement)
        : this.localState.domReferenceElement;

    return {
      open: this.popupStore.select('open'),
      transitionStatus: rawState.transitionStatus,
      domReferenceElement,
      referenceElement,
      floatingElement,
      positionReference: this.localState.positionReference,
      floatingId: rawState.floatingId,
    };
  }

  private refreshSnapshot() {
    const nextSnapshot = this.createSnapshot();

    if (floatingRootStateIsEqual(this.snapshot, nextSnapshot)) {
      return;
    }

    this.snapshot = nextSnapshot;

    for (const listener of this.listeners) {
      listener(this.snapshot);
    }
  }
}

export function usePopupFloatingRootContext(
  popupStore: {
    readonly context: { readonly floatingRootContext: PopupFloatingRootContext<any, any> };
    useSyncedValue(key: 'floatingId', value: string | undefined): void;
  },
  options: { floatingId: string | undefined; nested: boolean },
): FloatingRootContext {
  const { floatingId, nested } = options;
  const floatingRootContext = popupStore.context.floatingRootContext;

  floatingRootContext.setOptions({ nested }, false);
  popupStore.useSyncedValue('floatingId', floatingId);

  useIsoLayoutEffect(() => {
    floatingRootContext.setOptions({ nested });
  }, [floatingRootContext, nested]);

  return floatingRootContext;
}

function floatingRootStateIsEqual(a: Readonly<FloatingRootState>, b: Readonly<FloatingRootState>) {
  return (
    Object.is(a.open, b.open) &&
    Object.is(a.transitionStatus, b.transitionStatus) &&
    Object.is(a.domReferenceElement, b.domReferenceElement) &&
    Object.is(a.referenceElement, b.referenceElement) &&
    Object.is(a.floatingElement, b.floatingElement) &&
    Object.is(a.positionReference, b.positionReference) &&
    Object.is(a.floatingId, b.floatingId)
  );
}
