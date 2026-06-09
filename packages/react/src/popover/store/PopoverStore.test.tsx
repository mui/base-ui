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
  it('creates a floating root context that derives values from popup state', () => {
    const store = new PopoverStore(undefined, 'generated-id');
    const floatingRootContext = store.context.floatingRootContext;
    const trigger = document.createElement('button');
    const positioner = document.createElement('div');

    store.update({
      open: true,
      mounted: true,
      activeTriggerElement: trigger,
      positionerElement: positioner,
      transitionStatus: 'starting',
    });

    expect(floatingRootContext.select('open')).toBe(true);
    expect(floatingRootContext.select('transitionStatus')).toBe('starting');
    expect(floatingRootContext.select('referenceElement')).toBe(trigger);
    expect(floatingRootContext.select('domReferenceElement')).toBe(trigger);
    expect(floatingRootContext.select('floatingElement')).toBe(positioner);
    expect(floatingRootContext.select('floatingId')).toBe('generated-id');
  });

  it('keeps positioning overrides out of the popup store state', () => {
    const store = new PopoverStore();
    const floatingRootContext = store.context.floatingRootContext;
    const trigger = document.createElement('button');
    const positioner = document.createElement('div');
    const virtualReference = createVirtualReference();

    store.update({
      open: true,
      mounted: true,
      activeTriggerElement: trigger,
      positionerElement: positioner,
    });

    floatingRootContext.set('referenceElement', trigger);
    floatingRootContext.set('floatingElement', positioner);

    expect((store.state as Record<string, unknown>).referenceElement).toBeUndefined();
    expect((store.state as Record<string, unknown>).floatingElement).toBeUndefined();
    expect(floatingRootContext.select('referenceElement')).toBe(trigger);
    expect(floatingRootContext.select('floatingElement')).toBe(positioner);

    floatingRootContext.set('positionReference', virtualReference);

    expect((store.state as Record<string, unknown>).positionReference).toBeUndefined();
    expect(floatingRootContext.select('referenceElement')).toBe(virtualReference);
    expect(floatingRootContext.select('domReferenceElement')).toBe(trigger);

    floatingRootContext.set('positionReference', null);

    expect(floatingRootContext.select('referenceElement')).toBe(trigger);
  });

  it('emits floating openchange events through the floating context', () => {
    const store = new PopoverStore();
    const openChange = vi.fn();
    const details = createChangeEventDetails(REASONS.triggerPress);

    store.context.floatingRootContext.context.events.on('openchange', openChange);

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
