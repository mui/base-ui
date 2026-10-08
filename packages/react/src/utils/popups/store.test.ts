import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import {
  BasePopupStore,
  createInitialPopupStoreState,
  getHoverPopupInstantType,
  popupStoreSelectors,
} from './store';
import type { PopupOpenChangeEventDetails, PopupStoreContext, PopupStoreState } from './store';
import { PopupTriggerMap } from './popupTriggerMap';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

function createState(state: Partial<PopupStoreState<unknown>>) {
  return {
    ...createInitialPopupStoreState(new PopupTriggerMap()),
    activeTriggerId: 'trigger',
    ...state,
  };
}

describe('popupStoreSelectors', () => {
  describe('isOpenedByTrigger', () => {
    it('uses the controlled open state when present', () => {
      expect(
        popupStoreSelectors.isOpenedByTrigger(
          createState({
            open: false,
            openProp: true,
          }),
          'trigger',
        ),
      ).toBe(true);

      expect(
        popupStoreSelectors.isOpenedByTrigger(
          createState({
            open: true,
            openProp: false,
          }),
          'trigger',
        ),
      ).toBe(false);
    });

    it('uses the internal open state when uncontrolled', () => {
      expect(
        popupStoreSelectors.isOpenedByTrigger(
          createState({
            open: true,
          }),
          'trigger',
        ),
      ).toBe(true);

      expect(
        popupStoreSelectors.isOpenedByTrigger(
          createState({
            open: false,
          }),
          'trigger',
        ),
      ).toBe(false);
    });

    it('requires the trigger to be active', () => {
      expect(
        popupStoreSelectors.isOpenedByTrigger(
          createState({
            open: false,
            openProp: true,
          }),
          'other-trigger',
        ),
      ).toBe(false);
    });
  });

  describe('transitionStatus', () => {
    it('reports the starting phase while the popup is open but not yet mounted', () => {
      expect(
        popupStoreSelectors.transitionStatus(
          createState({
            open: true,
            mounted: false,
          }),
        ),
      ).toBe('starting');
    });

    it('uses the controlled open state to detect the starting phase', () => {
      expect(
        popupStoreSelectors.transitionStatus(
          createState({
            open: false,
            openProp: true,
            mounted: false,
          }),
        ),
      ).toBe('starting');
    });

    it('keeps the stored status once the opening cycle is mounted', () => {
      expect(
        popupStoreSelectors.transitionStatus(
          createState({
            open: true,
            mounted: true,
            transitionStatus: 'starting',
          }),
        ),
      ).toBe('starting');

      expect(
        popupStoreSelectors.transitionStatus(
          createState({
            open: true,
            mounted: true,
            transitionStatus: undefined,
          }),
        ),
      ).toBe(undefined);
    });

    it('does not start a new enter phase when an exit is reversed', () => {
      expect(
        popupStoreSelectors.transitionStatus(
          createState({
            open: true,
            mounted: true,
            transitionStatus: 'ending',
          }),
        ),
      ).toBe('ending');
    });

    it('keeps the stored status while the popup is closed', () => {
      expect(
        popupStoreSelectors.transitionStatus(
          createState({
            open: false,
            mounted: true,
            transitionStatus: 'ending',
          }),
        ),
      ).toBe('ending');

      expect(
        popupStoreSelectors.transitionStatus(
          createState({
            open: false,
            mounted: false,
            transitionStatus: undefined,
          }),
        ),
      ).toBe(undefined);
    });
  });
});

type TestState = PopupStoreState<unknown> & { extra: number };

class TestPopupStore extends BasePopupStore<
  TestState,
  PopupStoreContext<PopupOpenChangeEventDetails>,
  typeof popupStoreSelectors,
  PopupOpenChangeEventDetails
> {
  readonly steps: string[] = [];

  ignoreOpenChange = false;

  dropOpenChange = false;

  closeTrigger: Element | undefined = undefined;

  constructor(
    onOpenChange: (open: boolean, eventDetails: PopupOpenChangeEventDetails) => void,
    state: Partial<TestState> = {},
  ) {
    const triggerElements = new PopupTriggerMap();
    super(
      { ...createInitialPopupStoreState(triggerElements), extra: 0, ...state },
      {
        triggerElements,
        popupRef: React.createRef<HTMLElement>(),
        onOpenChange,
        onOpenChangeComplete: undefined,
      },
      popupStoreSelectors,
    );

    this.state.floatingRootContext.context.events.on('openchange', () => {
      this.steps.push('notify');
    });
    this.subscribe(() => {
      this.steps.push('commit');
    });
  }

  protected isOpenChangeIgnored() {
    return this.ignoreOpenChange;
  }

  protected getCloseTrigger() {
    return this.closeTrigger;
  }

  protected isOpenChangeDropped() {
    return this.dropOpenChange;
  }

  protected prepareOpenChange() {
    this.steps.push('prepare');
    return { extra: 1 };
  }

  protected completeOpenChange() {
    this.steps.push('complete');
  }
}

function createDetails(reason: string, trigger?: Element) {
  return createChangeEventDetails(reason, undefined, trigger);
}

describe('BasePopupStore', () => {
  describe('setOpen', () => {
    it('calls onOpenChange, notifies interactions, prepares, commits once and completes, in that order', () => {
      const store = new TestPopupStore(() => {
        store.steps.push('onOpenChange');
      });

      store.setOpen(true, createDetails(REASONS.triggerPress));

      expect(store.steps).toEqual(['onOpenChange', 'notify', 'prepare', 'commit', 'complete']);
    });

    it('notifies interactions about a dropped change without committing it', () => {
      const onOpenChange = vi.fn();
      const store = new TestPopupStore(onOpenChange);
      store.dropOpenChange = true;

      store.setOpen(true, createDetails(REASONS.triggerPress));

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(store.steps).toEqual(['notify']);
      expect(store.state.open).toBe(false);
    });

    it('commits the open state, the reason and the extra state together', () => {
      const store = new TestPopupStore(() => {});
      const trigger = document.createElement('button');
      trigger.id = 'trigger';

      store.setOpen(true, createDetails(REASONS.triggerPress, trigger));

      expect(store.state.open).toBe(true);
      expect(store.state.activeTriggerId).toBe('trigger');
      expect(store.state.activeTriggerElement).toBe(trigger);
      expect(store.state.openChangeReason).toBe(REASONS.triggerPress);
      expect(store.state.extra).toBe(1);
    });

    it('stops a cancelled change before it is prepared, notified or committed', () => {
      const store = new TestPopupStore((_open, eventDetails) => {
        eventDetails.cancel();
      });

      store.setOpen(true, createDetails(REASONS.triggerPress));

      expect(store.steps).toEqual([]);
      expect(store.state.open).toBe(false);
    });

    it('does not call onOpenChange for an ignored change', () => {
      const onOpenChange = vi.fn();
      const store = new TestPopupStore(onOpenChange);
      store.ignoreOpenChange = true;

      store.setOpen(true, createDetails(REASONS.triggerPress));

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(store.steps).toEqual([]);
    });

    it('calls onOpenChange for a close request while closed', () => {
      const onOpenChange = vi.fn();
      const store = new TestPopupStore(onOpenChange);

      store.setOpen(false, createDetails(REASONS.escapeKey));

      expect(onOpenChange).toHaveBeenCalledTimes(1);
    });

    it('reports no trigger for a close request that carries none by default', () => {
      const onOpenChange = vi.fn();
      const trigger = document.createElement('button');
      trigger.id = 'trigger';
      const store = new TestPopupStore(onOpenChange, {
        open: true,
        mounted: true,
        activeTriggerId: 'trigger',
        activeTriggerElement: trigger,
      });
      store.context.triggerElements.add('trigger', trigger);

      store.setOpen(false, createDetails(REASONS.escapeKey));

      expect(onOpenChange.mock.calls[0][1].trigger).toBe(undefined);
      expect(store.state.activeTriggerElement).toBe(trigger);
    });

    it('reports the close trigger the store names for a close request that carries none', () => {
      const onOpenChange = vi.fn();
      const store = new TestPopupStore(onOpenChange, { open: true });
      const trigger = document.createElement('button');
      store.closeTrigger = trigger;

      store.setOpen(false, createDetails(REASONS.escapeKey));

      expect(onOpenChange.mock.calls[0][1].trigger).toBe(trigger);
    });

    it('keeps the popup mounted when onOpenChange prevents unmounting on close', () => {
      const store = new TestPopupStore(
        (_open, eventDetails) => {
          eventDetails.preventUnmountOnClose();
        },
        { open: true },
      );

      store.setOpen(false, createDetails(REASONS.escapeKey));

      expect(store.state.preventUnmountingOnClose).toBe(true);
    });

    it('ignores a request to keep the popup mounted from a cancelled close', () => {
      const store = new TestPopupStore(
        (_open, eventDetails) => {
          eventDetails.preventUnmountOnClose();
          eventDetails.cancel();
        },
        { open: true },
      );

      store.setOpen(false, createDetails(REASONS.escapeKey));

      expect(store.state.open).toBe(true);
      expect(store.state.preventUnmountingOnClose).toBe(false);
    });
  });
});

describe('getHoverPopupInstantType', () => {
  it.each([
    {
      name: 'a focus open',
      open: true,
      reason: REASONS.triggerFocus,
      expected: { instantType: 'focus' },
    },
    {
      name: 'a trigger press close',
      open: false,
      reason: REASONS.triggerPress,
      expected: { instantType: 'dismiss' },
    },
    {
      name: 'an Escape close',
      open: false,
      reason: REASONS.escapeKey,
      expected: { instantType: 'dismiss' },
    },
    {
      name: 'a hover open',
      open: true,
      reason: REASONS.triggerHover,
      expected: { instantType: undefined },
    },
    { name: 'any other change', open: true, reason: REASONS.none, expected: {} },
  ])('maps $name', ({ open, reason, expected }) => {
    expect(getHoverPopupInstantType(open, reason)).toStrictEqual(expected);
  });
});
