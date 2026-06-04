import { describe, expect, it, vi } from 'vitest';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { ReferenceType } from '../../floating-ui-react';
import { PopoverStore } from './PopoverStore';

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

describe('PopoverStore', () => {
  it('acts as the floating root context by deriving values from popup state', () => {
    const store = new PopoverStore(undefined, 'generated-id');
    const trigger = document.createElement('button');
    const positioner = document.createElement('div');

    store.update({
      open: true,
      mounted: true,
      activeTriggerElement: trigger,
      positionerElement: positioner,
      transitionStatus: 'starting',
    });

    expect(store.select('open')).toBe(true);
    expect(store.select('transitionStatus')).toBe('starting');
    expect(store.select('referenceElement')).toBe(trigger);
    expect(store.select('domReferenceElement')).toBe(trigger);
    expect(store.select('floatingElement')).toBe(positioner);
    expect(store.select('floatingId')).toBe('generated-id');
  });

  it('keeps positioning overrides local to the floating root surface', () => {
    const store = new PopoverStore();
    const trigger = document.createElement('button');
    const positioner = document.createElement('div');
    const virtualReference = createVirtualReference();

    store.update({
      open: true,
      mounted: true,
      activeTriggerElement: trigger,
      positionerElement: positioner,
    });

    store.set('referenceElement', trigger);
    store.set('floatingElement', positioner);

    expect(store.state.referenceElement).toBe(null);
    expect(store.state.floatingElement).toBe(null);
    expect(store.select('referenceElement')).toBe(trigger);
    expect(store.select('floatingElement')).toBe(positioner);

    store.set('positionReference', virtualReference);

    expect(store.select('referenceElement')).toBe(virtualReference);
    expect(store.select('domReferenceElement')).toBe(trigger);

    store.set('positionReference', null);

    expect(store.select('referenceElement')).toBe(trigger);
  });

  it('emits floating openchange events from the popover store', () => {
    const store = new PopoverStore();
    const openChange = vi.fn();
    const details = createChangeEventDetails(REASONS.triggerPress);

    store.context.events.on('openchange', openChange);

    store.setOpen(true, details);

    expect(openChange).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        reason: REASONS.triggerPress,
        nested: false,
      }),
    );
  });
});
