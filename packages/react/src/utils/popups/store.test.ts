import { describe, expect, it, onTestFinished, vi } from 'vitest';
import {
  BasePopupStore,
  createInitialPopupStoreState,
  createPopupOpenState,
  createPopupStoreContext,
  getHoverPopupInstantType,
  popupStoreSelectors,
} from './store';
import type { PopupOpenChangeEventDetails, PopupStoreContext, PopupStoreState } from './store';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

function createState(state: Partial<PopupStoreState<unknown>>) {
  return {
    ...createInitialPopupStoreState(),
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

describe('popupStoreSelectors elements', () => {
  describe('positionerElement', () => {
    it('reports the positioner while the popup is mounted', () => {
      const positioner = document.createElement('div');
      expect(
        popupStoreSelectors.positionerElement(
          createState({ open: true, mounted: true, positionerElement: positioner }),
        ),
      ).toBe(positioner);
    });

    it('withholds the positioner while an opening popup is not mounted yet', () => {
      const positioner = document.createElement('div');
      expect(
        popupStoreSelectors.positionerElement(
          createState({ open: true, mounted: false, positionerElement: positioner }),
        ),
      ).toBe(null);
    });

    it('reports a keepMounted positioner while the popup is closed', () => {
      const positioner = document.createElement('div');
      expect(
        popupStoreSelectors.positionerElement(
          createState({ open: false, mounted: false, positionerElement: positioner }),
        ),
      ).toBe(positioner);
    });
  });

  describe('anchor', () => {
    it('returns the anchor override when one is set', () => {
      const trigger = document.createElement('button');
      const cursor = { getBoundingClientRect: () => new DOMRect() };
      expect(
        popupStoreSelectors.anchor(
          createState({ mounted: true, activeTriggerElement: trigger, anchorOverride: cursor }),
        ),
      ).toBe(cursor);
    });

    it('falls back to the active trigger while the popup is mounted', () => {
      const trigger = document.createElement('button');
      expect(
        popupStoreSelectors.anchor(createState({ mounted: true, activeTriggerElement: trigger })),
      ).toBe(trigger);
    });

    it('is null without an anchor override while the popup is unmounted', () => {
      const trigger = document.createElement('button');
      expect(
        popupStoreSelectors.anchor(createState({ mounted: false, activeTriggerElement: trigger })),
      ).toBe(null);
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

  closeTrigger: Element | undefined = undefined;

  constructor(
    onOpenChange: (open: boolean, eventDetails: PopupOpenChangeEventDetails) => void,
    state: Partial<TestState> = {},
  ) {
    super(
      { ...createInitialPopupStoreState(), extra: 0, ...state },
      { ...createPopupStoreContext(), onOpenChange },
      popupStoreSelectors,
    );

    this.context.events.on('openChange', () => {
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
    return this.closeTrigger ?? super.getCloseTrigger();
  }

  protected prepareOpenChange() {
    this.steps.push('prepare');
    return { extra: 1 };
  }

  protected prepareUnmount() {
    return { extra: -1 };
  }
}

function createConnectedButton() {
  const button = document.body.appendChild(document.createElement('button'));
  onTestFinished(() => {
    button.remove();
  });
  return button;
}

function createDetails(reason: string, trigger?: Element) {
  return createChangeEventDetails(reason, undefined, trigger);
}

describe('BasePopupStore', () => {
  describe('setOpen', () => {
    it('calls onOpenChange, notifies interactions, prepares and commits once, in that order', () => {
      const store = new TestPopupStore(() => {
        store.steps.push('onOpenChange');
      });

      store.setOpen(true, createDetails(REASONS.triggerPress));

      expect(store.steps).toEqual(['onOpenChange', 'notify', 'prepare', 'commit']);
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

    it.each([
      { name: 'closed', mounted: false },
      { name: 'still closing', mounted: true },
    ])('drops a close request while $name, reporting only that it was dropped', ({ mounted }) => {
      const onOpenChange = vi.fn();
      const onDroppedClose = vi.fn();
      const store = new TestPopupStore(onOpenChange, { mounted });
      store.context.events.on('droppedClose', onDroppedClose);

      store.setOpen(false, createDetails(REASONS.triggerHover));

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(store.steps).toEqual([]);
      expect(onDroppedClose).toHaveBeenCalledTimes(1);
    });

    it.each([
      {
        name: 'while a controlled popup is open but its last request closed it',
        state: { open: false, openProp: true },
      },
      {
        name: 'while a controlled popup has an open request its prop has not applied',
        state: { open: true, openProp: false },
      },
      { name: 'while open', state: { open: true } },
    ])('runs a close request $name', ({ state }) => {
      const onOpenChange = vi.fn();
      const onDroppedClose = vi.fn();
      const store = new TestPopupStore(onOpenChange, state);
      store.context.events.on('droppedClose', onDroppedClose);

      store.setOpen(false, createDetails(REASONS.escapeKey));

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(store.steps).toEqual(['notify', 'prepare', 'commit']);
      expect(store.state.open).toBe(false);
      expect(onDroppedClose).not.toHaveBeenCalled();
    });

    it('reports the active trigger for a close request that carries none by default', () => {
      const onOpenChange = vi.fn();
      const trigger = createConnectedButton();
      trigger.id = 'trigger';
      const store = new TestPopupStore(onOpenChange, {
        open: true,
        mounted: true,
        activeTriggerId: 'trigger',
        activeTriggerElement: trigger,
      });
      store.context.triggerElements.add('trigger', trigger);

      store.setOpen(false, createDetails(REASONS.escapeKey));

      expect(onOpenChange.mock.calls[0][1].trigger).toBe(trigger);
      expect(store.state.activeTriggerElement).toBe(trigger);
    });

    it('reports no trigger when the active trigger has left the document', () => {
      const onOpenChange = vi.fn();
      const trigger = document.createElement('button');
      const store = new TestPopupStore(onOpenChange, {
        open: true,
        mounted: true,
        activeTriggerId: 'trigger',
        activeTriggerElement: trigger,
      });

      store.setOpen(false, createDetails(REASONS.none));

      expect(onOpenChange.mock.calls[0][1].trigger).toBe(undefined);
    });

    it('reports the registered element of the active trigger over a stale one', () => {
      const onOpenChange = vi.fn();
      const staleTrigger = createConnectedButton();
      const trigger = createConnectedButton();
      const store = new TestPopupStore(onOpenChange, {
        open: true,
        mounted: true,
        activeTriggerId: 'trigger',
        activeTriggerElement: staleTrigger,
      });
      store.context.triggerElements.add('trigger', trigger);

      store.setOpen(false, createDetails(REASONS.escapeKey));

      expect(onOpenChange.mock.calls[0][1].trigger).toBe(trigger);
    });

    it('reports no trigger for a close request that carries none while no trigger is active', () => {
      const onOpenChange = vi.fn();
      const store = new TestPopupStore(onOpenChange, { open: true, mounted: true });
      store.context.triggerElements.add('trigger', document.createElement('button'));

      store.setOpen(false, createDetails(REASONS.escapeKey));

      expect(onOpenChange.mock.calls[0][1].trigger).toBe(undefined);
    });

    it('reports the close trigger the store names for a close request that carries none', () => {
      const onOpenChange = vi.fn();
      const store = new TestPopupStore(onOpenChange, { open: true });
      const trigger = createConnectedButton();
      store.closeTrigger = trigger;

      store.setOpen(false, createDetails(REASONS.escapeKey));

      expect(onOpenChange.mock.calls[0][1].trigger).toBe(trigger);
    });

    it('reports no trigger when the close trigger the store names has left the document', () => {
      const onOpenChange = vi.fn();
      const store = new TestPopupStore(onOpenChange, { open: true });
      store.closeTrigger = document.createElement('button');

      store.setOpen(false, createDetails(REASONS.escapeKey));

      expect(onOpenChange.mock.calls[0][1].trigger).toBe(undefined);
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

    it('ignores a request to keep the popup mounted from an open change', () => {
      const store = new TestPopupStore((open, eventDetails) => {
        if (open) {
          eventDetails.preventUnmountOnClose();
        }
      });

      store.setOpen(true, createDetails(REASONS.triggerPress));

      expect(store.state.open).toBe(true);
      expect(store.state.preventUnmountingOnClose).toBe(false);
    });

    it('ignores a late request to keep the popup mounted from a cancelled close', () => {
      const closeDetails: PopupOpenChangeEventDetails[] = [];
      const store = new TestPopupStore(
        (open, eventDetails) => {
          if (!open) {
            closeDetails.push(eventDetails);
            if (closeDetails.length === 1) {
              eventDetails.cancel();
            }
          }
        },
        { open: true, mounted: true },
      );

      store.setOpen(false, createDetails(REASONS.escapeKey));
      store.setOpen(false, createDetails(REASONS.outsidePress));
      expect(store.state.open).toBe(false);
      closeDetails[0].preventUnmountOnClose();

      expect(store.state.preventUnmountingOnClose).toBe(false);
    });

    it('keeps the popup mounted when the close asks for it after it is committed', () => {
      let closeDetails: PopupOpenChangeEventDetails | undefined;
      const store = new TestPopupStore(
        (open, eventDetails) => {
          if (!open) {
            closeDetails = eventDetails;
          }
        },
        { open: true, mounted: true },
      );

      store.setOpen(false, createDetails(REASONS.escapeKey));
      expect(store.state.preventUnmountingOnClose).toBe(false);
      closeDetails!.preventUnmountOnClose();

      expect(store.state.preventUnmountingOnClose).toBe(true);
    });

    it('keeps a controlled popup mounted when the close asks for it before the prop closes it', () => {
      let closeDetails: PopupOpenChangeEventDetails | undefined;
      const store = new TestPopupStore(
        (open, eventDetails) => {
          if (!open) {
            closeDetails = eventDetails;
          }
        },
        { open: true, openProp: true, mounted: true },
      );

      store.setOpen(false, createDetails(REASONS.escapeKey));
      expect(store.select('open')).toBe(true);
      closeDetails!.preventUnmountOnClose();

      expect(store.state.preventUnmountingOnClose).toBe(true);
    });

    it("keeps an earlier close's request to stay mounted when a later close commits before the prop closes the popup", () => {
      let closeCount = 0;
      const store = new TestPopupStore(
        (open, eventDetails) => {
          if (!open) {
            closeCount += 1;
            if (closeCount === 1) {
              eventDetails.preventUnmountOnClose();
            }
          }
        },
        { open: true, openProp: true, mounted: true },
      );

      // The prop still says open, so the second close isn't dropped.
      store.setOpen(false, createDetails(REASONS.escapeKey));
      expect(store.state.preventUnmountingOnClose).toBe(true);
      store.setOpen(false, createDetails(REASONS.outsidePress));

      expect(closeCount).toBe(2);
      expect(store.state.preventUnmountingOnClose).toBe(true);
    });

    it('applies a late request from a close after a later close commits under a lagging prop', () => {
      const closeDetails: PopupOpenChangeEventDetails[] = [];
      const store = new TestPopupStore(
        (open, eventDetails) => {
          if (!open) {
            closeDetails.push(eventDetails);
          }
        },
        { open: true, openProp: true, mounted: true },
      );

      store.setOpen(false, createDetails(REASONS.escapeKey));
      // The prop still says open, so the second close isn't dropped.
      store.setOpen(false, createDetails(REASONS.outsidePress));
      expect(closeDetails).toHaveLength(2);
      closeDetails[0].preventUnmountOnClose();

      expect(store.state.preventUnmountingOnClose).toBe(true);
    });

    it('lets the next open clear a late request made after the popup unmounted', () => {
      let closeDetails: PopupOpenChangeEventDetails | undefined;
      const store = new TestPopupStore(
        (open, eventDetails) => {
          if (!open) {
            closeDetails = eventDetails;
          }
        },
        { open: true, mounted: true },
      );

      store.setOpen(false, createDetails(REASONS.escapeKey));
      store.resetOnUnmount();
      closeDetails!.preventUnmountOnClose();
      expect(store.state.preventUnmountingOnClose).toBe(true);
      store.setOpen(true, createDetails(REASONS.triggerPress));

      expect(store.state.preventUnmountingOnClose).toBe(false);
    });

    it('keeps a late request from a close when an open request arrives while the prop still shows the popup', () => {
      let closeDetails: PopupOpenChangeEventDetails | undefined;
      const store = new TestPopupStore(
        (open, eventDetails) => {
          if (!open) {
            closeDetails = eventDetails;
          }
        },
        { open: true, openProp: true, mounted: true },
      );

      store.setOpen(false, createDetails(REASONS.escapeKey));
      store.setOpen(true, createDetails(REASONS.triggerFocus));
      closeDetails!.preventUnmountOnClose();

      expect(store.state.preventUnmountingOnClose).toBe(true);
    });

    it('keeps a late request from a close when a later close is dropped', () => {
      const closeDetails: PopupOpenChangeEventDetails[] = [];
      const store = new TestPopupStore(
        (open, eventDetails) => {
          if (!open) {
            closeDetails.push(eventDetails);
          }
        },
        { open: true, mounted: true },
      );

      store.setOpen(false, createDetails(REASONS.escapeKey));
      store.setOpen(false, createDetails(REASONS.outsidePress));
      expect(closeDetails).toHaveLength(1);
      closeDetails[0].preventUnmountOnClose();

      expect(store.state.preventUnmountingOnClose).toBe(true);
    });

    it('keeps a late request from a close when an open request arrives that the prop does not apply', () => {
      let closeDetails: PopupOpenChangeEventDetails | undefined;
      const store = new TestPopupStore(
        (open, eventDetails) => {
          if (!open) {
            closeDetails = eventDetails;
          }
        },
        { open: true, openProp: true, mounted: true },
      );

      store.setOpen(false, createDetails(REASONS.escapeKey));
      store.update({ openProp: false });
      // The parent declines the open without `cancel()`, so the popup keeps closing.
      store.setOpen(true, createDetails(REASONS.triggerFocus));
      expect(store.select('open')).toBe(false);
      closeDetails!.preventUnmountOnClose();

      expect(store.state.preventUnmountingOnClose).toBe(true);
    });

    it('ignores a late request to keep the popup mounted from an open change', () => {
      let openDetails: PopupOpenChangeEventDetails | undefined;
      const store = new TestPopupStore(
        (open, eventDetails) => {
          if (open) {
            openDetails = eventDetails;
          }
        },
        { open: false, openProp: false, mounted: false },
      );

      // A controlled open: the prop hasn't caught up, so the open change stays the latest one.
      store.setOpen(true, createDetails(REASONS.triggerPress));
      openDetails!.preventUnmountOnClose();

      expect(store.state.preventUnmountingOnClose).toBe(false);
    });

    it('ignores a late request to keep the popup mounted once the open prop reopens it', () => {
      let closeDetails: PopupOpenChangeEventDetails | undefined;
      const store = new TestPopupStore(
        (open, eventDetails) => {
          if (!open) {
            closeDetails = eventDetails;
          }
        },
        { open: true, openProp: true, mounted: true },
      );

      store.setOpen(false, createDetails(REASONS.escapeKey));
      store.update({ openProp: false });
      store.update({ openProp: true });
      closeDetails!.preventUnmountOnClose();

      expect(store.state.preventUnmountingOnClose).toBe(false);
    });

    it('ignores a late request to keep the popup mounted once a later change is committed', () => {
      const closeDetails: PopupOpenChangeEventDetails[] = [];
      const store = new TestPopupStore(
        (open, eventDetails) => {
          if (!open) {
            closeDetails.push(eventDetails);
          }
        },
        { open: true, mounted: true },
      );

      store.setOpen(false, createDetails(REASONS.escapeKey));
      store.setOpen(true, createDetails(REASONS.triggerPress));
      store.setOpen(false, createDetails(REASONS.outsidePress));
      expect(store.state.open).toBe(false);
      closeDetails[0].preventUnmountOnClose();

      expect(store.state.preventUnmountingOnClose).toBe(false);
    });
  });

  describe('interaction notification', () => {
    it('reports the change and the trigger named for the close', () => {
      const store = new TestPopupStore(() => {}, { open: true });
      store.closeTrigger = createConnectedButton();
      const onOpenChangeEvent = vi.fn();
      store.context.events.on('openChange', onOpenChangeEvent);
      const event = new KeyboardEvent('keydown');

      store.setOpen(false, createChangeEventDetails(REASONS.escapeKey, event));

      expect(onOpenChangeEvent).toHaveBeenCalledTimes(1);
      expect(onOpenChangeEvent.mock.calls[0][0]).toEqual({
        open: false,
        reason: REASONS.escapeKey,
        nativeEvent: event,
        triggerElement: store.closeTrigger,
      });
    });

    it('keeps the event of a click open when a hover open follows', () => {
      const store = new TestPopupStore(() => {});
      const click = new MouseEvent('click');

      store.setOpen(true, createChangeEventDetails(REASONS.triggerPress, click));
      store.setOpen(
        true,
        createChangeEventDetails(REASONS.triggerHover, new MouseEvent('mouseenter')),
      );

      expect(store.context.openEvent).toBe(click);
    });

    it('replaces the event of a hover open with a click that follows', () => {
      const store = new TestPopupStore(() => {});
      const click = new MouseEvent('click');

      store.setOpen(
        true,
        createChangeEventDetails(REASONS.triggerHover, new MouseEvent('mouseenter')),
      );
      store.setOpen(true, createChangeEventDetails(REASONS.triggerPress, click));

      expect(store.context.openEvent).toBe(click);
    });

    it('clears the open event on close', () => {
      const store = new TestPopupStore(() => {});

      store.setOpen(true, createChangeEventDetails(REASONS.triggerPress, new MouseEvent('click')));
      store.setOpen(
        false,
        createChangeEventDetails(REASONS.escapeKey, new KeyboardEvent('keydown')),
      );

      expect(store.context.openEvent).toBe(undefined);
    });
  });

  describe('anchor sync', () => {
    it('keeps the DOM reference once the popup unmounts and the active trigger is gone', () => {
      const trigger = document.createElement('button');
      const store = new TestPopupStore(() => {}, {
        mounted: true,
        activeTriggerElement: trigger,
        anchorElement: trigger,
      });

      store.set('mounted', false);

      expect(store.select('anchor')).toBe(null);
      expect(store.state.anchorElement).toBe(trigger);
    });

    it('moves an anchor override that followed the previous trigger to the new one', () => {
      const triggerA = document.createElement('button');
      const triggerB = document.createElement('button');
      const store = new TestPopupStore(() => {}, {
        mounted: true,
        activeTriggerElement: triggerA,
        anchorElement: triggerA,
        anchorOverride: triggerA,
      });

      store.set('activeTriggerElement', triggerB);

      expect(store.state.anchorOverride).toBe(triggerB);
      expect(store.state.anchorElement).toBe(triggerB);
    });

    it('keeps a virtual anchor override when the trigger switches', () => {
      const triggerA = document.createElement('button');
      const triggerB = document.createElement('button');
      const cursor = { getBoundingClientRect: () => new DOMRect() };
      const store = new TestPopupStore(() => {}, {
        mounted: true,
        activeTriggerElement: triggerA,
        anchorElement: triggerA,
        anchorOverride: cursor,
      });

      store.set('activeTriggerElement', triggerB);

      expect(store.state.anchorOverride).toBe(cursor);
      expect(store.state.anchorElement).toBe(triggerB);
    });
  });

  describe('resetOnUnmount', () => {
    it("clears the trigger and applies the store's own unmount state once closed", () => {
      const trigger = document.createElement('button');
      const store = new TestPopupStore(() => {}, {
        open: false,
        mounted: true,
        activeTriggerId: 'trigger',
        activeTriggerElement: trigger,
        preventUnmountingOnClose: true,
        extra: 1,
      });

      store.resetOnUnmount();

      expect(store.state.mounted).toBe(false);
      expect(store.state.preventUnmountingOnClose).toBe(false);
      expect(store.state.activeTriggerId).toBe(null);
      expect(store.state.activeTriggerElement).toBe(null);
      expect(store.state.extra).toBe(-1);
    });

    it('keeps the trigger of a request made after the close while open is true', () => {
      const trigger = document.createElement('button');
      const store = new TestPopupStore(() => {}, {
        open: true,
        mounted: true,
        activeTriggerId: 'trigger',
        activeTriggerElement: trigger,
        extra: 1,
      });

      store.resetOnUnmount();

      expect(store.state.mounted).toBe(false);
      expect(store.state.activeTriggerId).toBe('trigger');
      expect(store.state.activeTriggerElement).toBe(trigger);
      expect(store.state.extra).toBe(-1);
    });
  });

  describe('clearPositioning', () => {
    it('clears the anchor element and the anchor override in one update, keeping the positioner', () => {
      const anchor = document.createElement('button');
      const positioner = document.createElement('div');
      const store = new TestPopupStore(() => {}, {
        anchorElement: anchor,
        anchorOverride: anchor,
        positionerElement: positioner,
      });
      const listener = vi.fn();
      store.subscribe(listener);

      store.clearPositioning();

      expect(store.state.anchorElement).toBe(null);
      expect(store.state.anchorOverride).toBe(null);
      expect(store.state.positionerElement).toBe(positioner);
      expect(listener).toHaveBeenCalledTimes(1);
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

describe('createPopupOpenState', () => {
  it('clears a previous unmount-prevention request when opening', () => {
    const state = createInitialPopupStoreState();
    state.preventUnmountingOnClose = true;

    const nextState = createPopupOpenState(state, true, undefined, false);

    expect(nextState.preventUnmountingOnClose).toBe(false);
    expect(state.preventUnmountingOnClose).toBe(true);
  });

  it('sets the unmount-prevention request when closing', () => {
    const state = createInitialPopupStoreState();

    const nextState = createPopupOpenState(state, false, undefined, true);

    expect(nextState.preventUnmountingOnClose).toBe(true);
  });

  it('preserves the active trigger when closing without a trigger', () => {
    const state = createInitialPopupStoreState();
    const trigger = document.createElement('button');
    state.activeTriggerId = 'trigger-id';
    state.activeTriggerElement = trigger;

    const nextState = createPopupOpenState(state, false, undefined, false);

    expect(nextState.activeTriggerId).toBe('trigger-id');
    expect(nextState.activeTriggerElement).toBe(trigger);
  });

  it('keeps the active trigger id when a close names the active trigger', () => {
    // The Root matches the element to its registered id, which can differ from its own `id`.
    const state = createInitialPopupStoreState();
    const trigger = document.createElement('button');
    trigger.id = 'element-id';
    state.activeTriggerId = 'registered-id';
    state.activeTriggerElement = trigger;

    const nextState = createPopupOpenState(state, false, trigger, false);

    expect(nextState.activeTriggerId).toBe('registered-id');
    expect(nextState.activeTriggerElement).toBe(trigger);
  });

  it('keeps the trigger id a controlled `triggerId` resolves to when a close names the active trigger', () => {
    // The `triggerId` prop moved the open popup to the second trigger, which updates only the
    // stored element.
    const state = { ...createInitialPopupStoreState(), triggerIdProp: 'second' };
    const trigger = document.createElement('button');
    trigger.id = 'second';
    state.activeTriggerId = 'first';
    state.activeTriggerElement = trigger;

    const nextState = createPopupOpenState(state, false, trigger, false);

    expect(nextState.activeTriggerId).toBe('second');
    expect(nextState.activeTriggerElement).toBe(trigger);
  });

  it('makes a different trigger that a close names the active one', () => {
    const state = createInitialPopupStoreState();
    state.activeTriggerId = 'first';
    state.activeTriggerElement = document.createElement('button');
    const trigger = document.createElement('button');
    trigger.id = 'second';

    const nextState = createPopupOpenState(state, false, trigger, false);

    expect(nextState.activeTriggerId).toBe('second');
    expect(nextState.activeTriggerElement).toBe(trigger);
  });

  it('records whether an open request carried a trigger', () => {
    const state = createInitialPopupStoreState();
    const trigger = document.createElement('button');
    trigger.id = 'trigger-id';

    expect(createPopupOpenState(state, true, undefined, false).openedWithoutTrigger).toBe(true);
    expect(createPopupOpenState(state, true, trigger, false).openedWithoutTrigger).toBe(false);
  });

  it('keeps the trigger-less open flag through a close request', () => {
    // A controlled root may decline the close and stay open; the Root resets the flag itself once
    // the popup is effectively closed.
    const state = createInitialPopupStoreState();
    state.openedWithoutTrigger = true;

    expect(createPopupOpenState(state, false, undefined, false).openedWithoutTrigger).toBe(true);
  });
});
