import { describe, expect, it, vi } from 'vitest';
import { FloatingRootStore } from '../../floating-ui-react/components/FloatingRootStore';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { PopupTriggerMap } from './popupTriggerMap';
import { runOpenChange } from './openChangeTransaction';
import type { OpenChangeAdapter } from './openChangeTransaction';

type Details = BaseUIChangeEventDetails<string> & { preventUnmountOnClose(): void };

function setup(adapter: Partial<OpenChangeAdapter<Details>> = {}) {
  const order: string[] = [];
  const floatingRootContext = new FloatingRootStore({
    open: false,
    transitionStatus: undefined,
    referenceElement: null,
    floatingElement: null,
    triggerElements: new PopupTriggerMap(),
    floatingId: undefined,
    nested: false,
    onOpenChange: undefined,
  });
  const dispatchOpenChange = vi
    .spyOn(floatingRootContext, 'dispatchOpenChange')
    .mockImplementation(() => {
      order.push('dispatchOpenChange');
    });
  const onOpenChange = vi.fn((_open: boolean, _details: Details) => {
    order.push('onOpenChange');
  });
  const commit = vi.fn((_preventUnmountOnClose: boolean) => {
    order.push('commit');
  });

  function run(nextOpen: boolean, details: Details) {
    runOpenChange(floatingRootContext, nextOpen, details, {
      open: true,
      onOpenChange,
      commit,
      ...adapter,
    });
  }

  return { order, dispatchOpenChange, onOpenChange, commit, run };
}

function createDetails(reason: string, trigger?: Element) {
  return createChangeEventDetails(reason, undefined, trigger) as Details;
}

describe('runOpenChange', () => {
  it('asks the consumer, then records and emits, then commits', () => {
    const { order, dispatchOpenChange, onOpenChange, run } = setup();
    const details = createDetails(REASONS.escapeKey);

    run(false, details);

    expect(onOpenChange).toHaveBeenCalledWith(false, details);
    expect(dispatchOpenChange).toHaveBeenCalledWith(false, details);
    expect(order).toEqual(['onOpenChange', 'dispatchOpenChange', 'commit']);
  });

  it('only emits an unrecorded close when closing a closed popup', () => {
    const { order, dispatchOpenChange, run } = setup({ open: false });
    const details = createDetails(REASONS.imperativeAction);

    run(false, details);

    // The interactions hear it to cancel a pending open; the consumer isn't asked.
    expect(order).toEqual(['dispatchOpenChange']);
    expect(dispatchOpenChange).toHaveBeenCalledWith(false, details, false);
  });

  it('opens an open popup again', () => {
    const { order, run } = setup({ open: true });

    run(true, createDetails(REASONS.triggerPress));

    expect(order).toEqual(['onOpenChange', 'dispatchOpenChange', 'commit']);
  });

  it('stops after the consumer when it cancels the change', () => {
    const { order, onOpenChange, run } = setup();
    onOpenChange.mockImplementation((_open, details) => {
      order.push('onOpenChange');
      details.cancel();
    });

    run(false, createDetails(REASONS.outsidePress));

    expect(order).toEqual(['onOpenChange']);
  });

  it('stops after the consumer when the root refuses the change', () => {
    const { order, run } = setup({ refused: true });

    run(false, createDetails(REASONS.triggerPress));

    expect(order).toEqual(['onOpenChange']);
  });

  it("commits the consumer's request to keep the popup mounted", () => {
    const { commit, onOpenChange, run } = setup();

    run(false, createDetails(REASONS.escapeKey));
    expect(commit).toHaveBeenLastCalledWith(false);

    onOpenChange.mockImplementationOnce((_open, details) => {
      details.preventUnmountOnClose();
    });
    run(false, createDetails(REASONS.escapeKey));
    expect(commit).toHaveBeenLastCalledWith(true);

    // The request doesn't carry over to the next close.
    run(false, createDetails(REASONS.escapeKey));
    expect(commit).toHaveBeenLastCalledWith(false);
  });

  it("reports the root's trigger for a close that names none", () => {
    const trigger = document.createElement('button');
    const otherTrigger = document.createElement('button');
    const { run } = setup({ trigger });

    const close = createDetails(REASONS.escapeKey);
    run(false, close);
    expect(close.trigger).toBe(trigger);

    const closeFromOtherTrigger = createDetails(REASONS.triggerPress, otherTrigger);
    run(false, closeFromOtherTrigger);
    expect(closeFromOtherTrigger.trigger).toBe(otherTrigger);

    const open = createDetails(REASONS.imperativeAction);
    run(true, open);
    expect(open.trigger).toBe(undefined);
  });
});
