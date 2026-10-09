import { describe, expect, it } from 'vitest';
import {
  applyOpenRequest,
  changeTriggerRegistry,
  claimOnRegister,
  claimSubmenuOnRegister,
  createTriggerOwnership,
  followAnchor,
  isLoneTriggerClaimable,
  isTriggerStillLost,
  releaseLostTrigger,
  releaseUnmountedTrigger,
  setOwnerElement,
  settleTriggerOwnership,
} from './triggerOwnership';
import type { TriggerOwnershipRecord, TriggerOwnershipState } from './triggerOwnership';
import { PopupTriggerMap } from './popupTriggerMap';

function createElement(id = '') {
  const element = document.createElement('button');
  element.id = id;
  return element;
}

function createRegistry(...entries: Array<[string, Element]>) {
  const registry = new PopupTriggerMap();
  for (const [id, element] of entries) {
    registry.add(id, element);
  }
  return registry;
}

function createState(
  overrides: Partial<Omit<TriggerOwnershipState, 'triggerOwnership'>> = {},
  record: Partial<TriggerOwnershipRecord> = {},
): TriggerOwnershipState {
  const initial = createTriggerOwnership();
  return {
    ...initial,
    ...overrides,
    triggerOwnership: { ...initial.triggerOwnership, ...record },
  };
}

describe('triggerOwnership', () => {
  describe('createTriggerOwnership', () => {
    it('starts without an owner, or with the given default owner id', () => {
      expect(createTriggerOwnership()).toEqual({
        activeTriggerId: null,
        activeTriggerElement: null,
        triggerOwnership: {
          lastTriggerElement: null,
          openedWithoutTrigger: false,
          resolvedTriggerId: null,
          registryVersion: 0,
          hasLoneTrigger: false,
        },
      });
      expect(createTriggerOwnership('default').activeTriggerId).toBe('default');
    });
  });

  describe('applyOpenRequest', () => {
    it('makes the trigger of an open request the owner, identified by its DOM id', () => {
      const trigger = createElement('dom-id');

      const next = applyOpenRequest(createState(), true, trigger);

      expect(next.activeTriggerId).toBe('dom-id');
      expect(next.activeTriggerElement).toBe(trigger);
      expect(next.triggerOwnership.openedWithoutTrigger).toBe(false);
    });

    it('leaves a popup opened without a trigger unowned and records it', () => {
      const owner = createElement('owner');
      const state = createState({ activeTriggerId: 'owner', activeTriggerElement: owner });

      const next = applyOpenRequest(state, true, undefined);

      expect(next.activeTriggerId).toBe(null);
      expect(next.activeTriggerElement).toBe(null);
      expect(next.triggerOwnership.openedWithoutTrigger).toBe(true);
    });

    it('keeps the owner and the trigger-less flag on a close request without a trigger', () => {
      const owner = createElement('owner');
      const state = createState(
        { activeTriggerId: 'owner', activeTriggerElement: owner },
        { openedWithoutTrigger: true },
      );

      const next = applyOpenRequest(state, false, undefined);

      expect(next.activeTriggerId).toBe('owner');
      expect(next.activeTriggerElement).toBe(owner);
      expect(next.triggerOwnership).toBe(state.triggerOwnership);
    });

    it('moves ownership to the trigger a close request names', () => {
      const owner = createElement('owner');
      const other = createElement('other');
      const state = createState({ activeTriggerId: 'owner', activeTriggerElement: owner });

      const next = applyOpenRequest(state, false, other);

      expect(next.activeTriggerId).toBe('other');
      expect(next.activeTriggerElement).toBe(other);
    });
  });

  describe('changeTriggerRegistry', () => {
    it('changes nothing while the popup is closed', () => {
      const trigger = createElement();
      const registry = createRegistry(['trigger', trigger]);

      expect(changeTriggerRegistry(createState(), registry, false)).toBe(null);
      expect(changeTriggerRegistry(createState(), createRegistry(), false)).toBe(null);
    });

    it('moves the registry version on and tracks a lone trigger while the popup is open', () => {
      const first = createElement();
      const second = createElement();
      const state = createState({}, { registryVersion: 3 });

      const afterFirst = changeTriggerRegistry(state, createRegistry(['first', first]), true);
      expect(afterFirst?.triggerOwnership?.registryVersion).toBe(4);
      expect(afterFirst?.triggerOwnership?.hasLoneTrigger).toBe(true);

      const afterSecond = changeTriggerRegistry(
        state,
        createRegistry(['first', first], ['second', second]),
        true,
      );
      expect(afterSecond?.triggerOwnership?.hasLoneTrigger).toBe(false);

      const afterUnregister = changeTriggerRegistry(state, createRegistry(), true);
      expect(afterUnregister?.triggerOwnership?.registryVersion).toBe(4);
      expect(afterUnregister?.triggerOwnership?.hasLoneTrigger).toBe(false);
    });
  });

  describe('claimOnRegister', () => {
    it('lets the owner refresh its element and forward its state only while open', () => {
      const element = createElement();
      const state = createState({ activeTriggerId: 'trigger' });

      expect(claimOnRegister(state, 'trigger', element, true, 'trigger')).toEqual({
        changes: { activeTriggerElement: element },
        forwardState: true,
      });
      expect(claimOnRegister(state, 'trigger', element, false, 'trigger')).toEqual({
        changes: { activeTriggerElement: element },
        forwardState: false,
      });
    });

    it('lets the first trigger that registers claim an open, unowned popup', () => {
      const element = createElement();

      expect(claimOnRegister(createState(), 'trigger', element, true, null)).toEqual({
        changes: { activeTriggerId: 'trigger', activeTriggerElement: element },
        forwardState: true,
      });
    });

    it('does not claim a closed popup, an owned popup, or one opened without a trigger', () => {
      const element = createElement();

      expect(claimOnRegister(createState(), 'trigger', element, false, null)).toBe(null);
      expect(claimOnRegister(createState(), 'trigger', element, true, 'other')).toBe(null);
      expect(
        claimOnRegister(
          createState({}, { openedWithoutTrigger: true }),
          'trigger',
          element,
          true,
          null,
        ),
      ).toBe(null);
    });
  });

  describe('claimSubmenuOnRegister', () => {
    it('claims an open submenu it owns or that has no owner, even when opened without a trigger', () => {
      const element = createElement();

      expect(claimSubmenuOnRegister('trigger', element, true, null, null)).toEqual({
        activeTriggerId: 'trigger',
        activeTriggerElement: element,
      });
      expect(claimSubmenuOnRegister('trigger', element, true, 'other', element)).toEqual({
        activeTriggerId: 'trigger',
        activeTriggerElement: element,
      });
    });

    it('does not claim a closed submenu or one another trigger owns', () => {
      const element = createElement();

      expect(claimSubmenuOnRegister('trigger', element, false, null, null)).toBe(null);
      expect(claimSubmenuOnRegister('trigger', element, true, 'other', createElement())).toBe(null);
    });
  });

  describe('settleTriggerOwnership', () => {
    it('resets the session bookkeeping while the popup is closed', () => {
      const state = createState(
        {},
        { openedWithoutTrigger: true, resolvedTriggerId: 'trigger', hasLoneTrigger: true },
      );

      const { changes, lostTriggerId } = settleTriggerOwnership(
        state,
        createRegistry(),
        false,
        'trigger',
      );

      expect(lostTriggerId).toBe(null);
      expect(changes?.triggerOwnership).toEqual({
        ...state.triggerOwnership,
        openedWithoutTrigger: false,
        resolvedTriggerId: null,
        hasLoneTrigger: false,
      });
    });

    it('changes nothing when a closed popup has nothing to reset', () => {
      expect(settleTriggerOwnership(createState(), createRegistry(), false, null)).toEqual({
        changes: null,
        lostTriggerId: null,
      });
    });

    it('resolves a registered owner and refreshes its element', () => {
      const stale = createElement();
      const current = createElement();
      const state = createState({ activeTriggerId: 'trigger', activeTriggerElement: stale });

      const { changes } = settleTriggerOwnership(
        state,
        createRegistry(['trigger', current]),
        true,
        'trigger',
      );

      expect(changes?.activeTriggerElement).toBe(current);
      expect(changes?.triggerOwnership?.resolvedTriggerId).toBe('trigger');
    });

    it('hands the owner over to the id its element is registered under', () => {
      const owner = createElement('dom-id');
      const state = createState({ activeTriggerId: 'dom-id', activeTriggerElement: owner });

      const { changes, lostTriggerId } = settleTriggerOwnership(
        state,
        createRegistry(['registered-id', owner]),
        true,
        'dom-id',
      );

      expect(lostTriggerId).toBe(null);
      expect(changes?.activeTriggerId).toBe('registered-id');
      expect(changes?.activeTriggerElement).toBe(owner);
      expect(changes?.triggerOwnership?.resolvedTriggerId).toBe('registered-id');
    });

    it('reports a resolved owner that unregistered as lost', () => {
      const state = createState({ activeTriggerId: 'trigger' }, { resolvedTriggerId: 'trigger' });

      const { lostTriggerId } = settleTriggerOwnership(state, createRegistry(), true, 'trigger');

      expect(lostTriggerId).toBe('trigger');
    });

    it('keeps a pending owner that has not registered yet', () => {
      const state = createState({ activeTriggerId: 'pending' }, { resolvedTriggerId: 'previous' });

      const { changes, lostTriggerId } = settleTriggerOwnership(
        state,
        createRegistry(['other', createElement()]),
        true,
        'pending',
      );

      expect(lostTriggerId).toBe(null);
      expect(changes?.activeTriggerId).toBeUndefined();
      expect(changes?.triggerOwnership?.resolvedTriggerId).toBe(null);
    });

    it('claims a lone registered trigger for an unowned popup', () => {
      const element = createElement();

      const { changes } = settleTriggerOwnership(
        createState(),
        createRegistry(['trigger', element]),
        true,
        null,
      );

      expect(changes?.activeTriggerId).toBe('trigger');
      expect(changes?.activeTriggerElement).toBe(element);
      expect(changes?.triggerOwnership?.resolvedTriggerId).toBe('trigger');
      expect(changes?.triggerOwnership?.hasLoneTrigger).toBe(true);
    });

    it('does not claim a lone trigger for a popup opened without a trigger, or among several', () => {
      const element = createElement();

      expect(
        settleTriggerOwnership(
          createState({}, { openedWithoutTrigger: true }),
          createRegistry(['trigger', element]),
          true,
          null,
        ).changes?.activeTriggerId,
      ).toBeUndefined();
      expect(
        settleTriggerOwnership(
          createState(),
          createRegistry(['first', element], ['second', createElement()]),
          true,
          null,
        ).changes?.activeTriggerId,
      ).toBeUndefined();
    });

    it('does not claim another trigger when the owner was lost', () => {
      const state = createState({ activeTriggerId: 'owner' }, { resolvedTriggerId: 'owner' });

      const { changes, lostTriggerId } = settleTriggerOwnership(
        state,
        createRegistry(['other', createElement()]),
        true,
        'owner',
      );

      expect(lostTriggerId).toBe('owner');
      expect(changes?.activeTriggerId).toBeUndefined();
    });
  });

  describe('isTriggerStillLost', () => {
    it('is true only while the popup is open, still owned by the lost id and nothing re-registered it', () => {
      const registry = createRegistry();

      expect(isTriggerStillLost('owner', registry, true, 'owner')).toBe(true);
      expect(isTriggerStillLost('owner', registry, false, 'owner')).toBe(false);
      expect(isTriggerStillLost('owner', registry, true, 'other')).toBe(false);
      expect(
        isTriggerStillLost('owner', createRegistry(['owner', createElement()]), true, 'owner'),
      ).toBe(false);
    });
  });

  describe('releasing the owner', () => {
    it('releases the owner when it is lost or the popup unmounts', () => {
      expect(releaseLostTrigger()).toEqual({ activeTriggerId: null, activeTriggerElement: null });
      expect(releaseUnmountedTrigger()).toEqual({
        activeTriggerId: null,
        activeTriggerElement: null,
      });
    });

    it('sets the owner element', () => {
      const element = createElement();
      expect(setOwnerElement(element)).toEqual({ activeTriggerElement: element });
    });
  });

  describe('followAnchor', () => {
    it('records the anchor as the last trigger, and clears it with the anchor', () => {
      const anchor = createElement();
      const state = createState();

      const recorded = followAnchor(state, anchor);
      expect(recorded.lastTriggerElement).toBe(anchor);

      const cleared = followAnchor({ ...state, triggerOwnership: recorded }, null);
      expect(cleared.lastTriggerElement).toBe(null);
    });

    it('returns the same record when the last trigger does not change', () => {
      const state = createState();
      expect(followAnchor(state, null)).toBe(state.triggerOwnership);
    });
  });

  describe('isLoneTriggerClaimable', () => {
    it('is true for a lone trigger unless the popup was opened without a trigger', () => {
      expect(isLoneTriggerClaimable(createState(), true)).toBe(true);
      expect(isLoneTriggerClaimable(createState(), false)).toBe(false);
      expect(isLoneTriggerClaimable(createState({}, { openedWithoutTrigger: true }), true)).toBe(
        false,
      );
    });
  });
});
