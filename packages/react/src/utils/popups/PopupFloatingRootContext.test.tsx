import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import type { ReferenceType } from '../../floating-ui-react';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import {
  createInitialPopupStoreStateBase,
  popupStoreSelectors,
  type PopupStoreContext,
  type PopupStoreSelectors,
  type PopupStoreStateBase,
} from './store';
import { PopupTriggerMap } from './popupTriggerMap';
import { PopupFloatingRootContext } from './PopupFloatingRootContext';

type State = PopupStoreStateBase<unknown>;
type ChangeEventDetails = ReturnType<typeof createChangeEventDetails>;
type Context = PopupStoreContext<ChangeEventDetails>;

function createStore() {
  return new ReactStore<State, Context, PopupStoreSelectors>(
    createInitialPopupStoreStateBase(),
    {
      triggerElements: new PopupTriggerMap(),
      popupRef: React.createRef<HTMLElement | null>(),
      onOpenChange: undefined,
      onOpenChangeComplete: undefined,
    },
    popupStoreSelectors,
  );
}

function createVirtualReference(): ReferenceType {
  return {
    getBoundingClientRect() {
      return {
        x: 0,
        y: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: 0,
        height: 0,
      };
    },
  };
}

describe('PopupFloatingRootContext', () => {
  it('derives root state from the popup store', () => {
    const store = createStore();
    const floatingRootContext = new PopupFloatingRootContext({
      popupStore: store,
      nested: false,
      onOpenChange: undefined,
    });
    const trigger = document.createElement('button');
    const positioner = document.createElement('div');

    store.update({
      open: true,
      mounted: true,
      activeTriggerElement: trigger,
      positionerElement: positioner,
      floatingId: 'popup-id',
      transitionStatus: 'starting',
    });

    expect(floatingRootContext.select('open')).toBe(true);
    expect(floatingRootContext.select('transitionStatus')).toBe('starting');
    expect(floatingRootContext.select('referenceElement')).toBe(trigger);
    expect(floatingRootContext.select('domReferenceElement')).toBe(trigger);
    expect(floatingRootContext.select('floatingElement')).toBe(positioner);
    expect(floatingRootContext.select('floatingId')).toBe('popup-id');
  });

  it('keeps floating-local state out of the popup store', () => {
    const store = createStore();
    const floatingRootContext = new PopupFloatingRootContext({
      popupStore: store,
      nested: false,
      onOpenChange: undefined,
    });
    const trigger = document.createElement('button');
    const virtualReference = createVirtualReference();

    store.update({
      open: true,
      mounted: true,
      activeTriggerElement: trigger,
    });

    floatingRootContext.set('positionReference', virtualReference);

    expect(floatingRootContext.select('referenceElement')).toBe(virtualReference);
    expect((store.state as Record<string, unknown>).positionReference).toBeUndefined();

    floatingRootContext.set('positionReference', null);

    expect(floatingRootContext.select('referenceElement')).toBe(trigger);
  });

  it('treats a reference override matching the derived value as no override', () => {
    const store = createStore();
    const floatingRootContext = new PopupFloatingRootContext({
      popupStore: store,
      nested: false,
      onOpenChange: undefined,
    });
    const trigger = document.createElement('button');

    store.update({
      open: true,
      mounted: true,
      activeTriggerElement: trigger,
    });

    floatingRootContext.set('referenceElement', trigger);

    store.update({
      mounted: false,
      activeTriggerElement: null,
    });

    expect(floatingRootContext.select('referenceElement')).toBe(null);
  });

  it('supports custom resolvers for component-specific popup topology', () => {
    const store = createStore();
    const customReference = document.createElement('span');
    const customFloating = document.createElement('div');
    const floatingRootContext = new PopupFloatingRootContext({
      popupStore: store,
      nested: false,
      onOpenChange: undefined,
      resolveReference: () => customReference,
      resolveFloating: () => customFloating,
    });

    store.update({ mounted: true });

    expect(floatingRootContext.select('referenceElement')).toBe(customReference);
    expect(floatingRootContext.select('floatingElement')).toBe(customFloating);
  });

  it('forwards setOpen and emits openchange events', () => {
    const store = createStore();
    const onOpenChange = vi.fn();
    const openChange = vi.fn();
    const floatingRootContext = new PopupFloatingRootContext({
      popupStore: store,
      nested: true,
      onOpenChange,
    });
    const details = createChangeEventDetails('trigger-press');

    floatingRootContext.context.events.on('openchange', openChange);

    floatingRootContext.setOpen(true, details);
    floatingRootContext.dispatchOpenChange(true, details);

    expect(onOpenChange).toHaveBeenCalledWith(true, details);
    expect(openChange).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        nested: true,
        reason: 'trigger-press',
      }),
    );
  });

  it('serializes to floating state without traversing the popup store back-reference', () => {
    const store = createStore();
    const floatingRootContext = new PopupFloatingRootContext({
      popupStore: store,
      nested: false,
      onOpenChange: undefined,
    });

    (store.context as Context & { floatingRootContext: unknown }).floatingRootContext =
      floatingRootContext;

    store.update({
      open: true,
      mounted: true,
      floatingId: 'popup-id',
      transitionStatus: 'starting',
    });

    const serialized = JSON.stringify(store.context);
    const parsed = JSON.parse(serialized);

    expect(serialized).not.toContain('popupStore');
    expect(parsed.floatingRootContext).toEqual({
      open: true,
      transitionStatus: 'starting',
      domReferenceElement: null,
      referenceElement: null,
      floatingElement: null,
      positionReference: null,
      floatingId: 'popup-id',
    });
  });
});
