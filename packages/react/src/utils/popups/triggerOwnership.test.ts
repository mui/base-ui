import { describe, expect, it } from 'vitest';
import { claimOnRegister, settleTriggerOwnership } from './triggerOwnership';
import type { TriggerOwnershipState } from './triggerOwnership';
import { createInitialPopupStoreState } from './store';
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

function createState(overrides: Partial<TriggerOwnershipState> = {}): TriggerOwnershipState {
  return { ...createInitialPopupStoreState(), ...overrides };
}

describe('triggerOwnership', () => {
  describe('claimOnRegister', () => {
    it('lets the owner refresh its element whether the popup is open or closed', () => {
      const element = createElement();
      const state = createState({ activeTriggerId: 'trigger' });

      expect(claimOnRegister(state, 'trigger', element, true, 'trigger')).toEqual({
        activeTriggerElement: element,
      });
      expect(claimOnRegister(state, 'trigger', element, false, 'trigger')).toEqual({
        activeTriggerElement: element,
      });
    });

    it('lets the first trigger that registers claim an open, unowned popup', () => {
      const element = createElement();

      expect(claimOnRegister(createState(), 'trigger', element, true, null)).toEqual({
        activeTriggerId: 'trigger',
        activeTriggerElement: element,
      });
    });

    it('does not claim a closed popup, an owned popup, or one opened without a trigger', () => {
      const element = createElement();

      expect(claimOnRegister(createState(), 'trigger', element, false, null)).toBe(null);
      expect(claimOnRegister(createState(), 'trigger', element, true, 'other')).toBe(null);
      expect(
        claimOnRegister(
          createState({ openedWithoutTrigger: true }),
          'trigger',
          element,
          true,
          null,
        ),
      ).toBe(null);
    });
    it('follows a controlled owner id over the stored one', () => {
      const element = createElement();

      // Controlled to another trigger: an unowned store does not let this trigger claim.
      expect(claimOnRegister(createState(), 'trigger', element, true, 'owner')).toBe(null);
      // Controlled to this trigger: it refreshes its element although another one is stored.
      expect(
        claimOnRegister(
          createState({ activeTriggerId: 'other' }),
          'trigger',
          element,
          true,
          'trigger',
        ),
      ).toEqual({ activeTriggerElement: element });
    });
  });

  describe('settleTriggerOwnership', () => {
    it('resets the session bookkeeping while the popup is closed', () => {
      const state = createState({
        openedWithoutTrigger: true,
        resolvedTriggerId: 'trigger',
        hasLoneTrigger: true,
      });

      const [changes, lostTriggerId] = settleTriggerOwnership(
        state,
        createRegistry(),
        false,
        'trigger',
      );

      expect(lostTriggerId).toBe(null);
      expect(changes).toEqual({
        openedWithoutTrigger: false,
        resolvedTriggerId: null,
        hasLoneTrigger: false,
      });
    });

    it('resolves a registered owner and refreshes its element', () => {
      const stale = createElement();
      const current = createElement();
      const state = createState({ activeTriggerId: 'trigger', activeTriggerElement: stale });

      const [changes] = settleTriggerOwnership(
        state,
        createRegistry(['trigger', current]),
        true,
        'trigger',
      );

      expect(changes.activeTriggerElement).toBe(current);
      expect(changes.resolvedTriggerId).toBe('trigger');
    });

    it('hands the owner over to the id its element is registered under', () => {
      const owner = createElement('dom-id');
      const state = createState({ activeTriggerId: 'dom-id', activeTriggerElement: owner });

      const [changes, lostTriggerId] = settleTriggerOwnership(
        state,
        createRegistry(['registered-id', owner]),
        true,
        'dom-id',
      );

      expect(lostTriggerId).toBe(null);
      expect(changes.activeTriggerId).toBe('registered-id');
      expect(changes.activeTriggerElement).toBe(owner);
      expect(changes.resolvedTriggerId).toBe('registered-id');
    });

    it('reports a resolved owner that unregistered as lost', () => {
      const state = createState({ activeTriggerId: 'trigger', resolvedTriggerId: 'trigger' });

      const [, lostTriggerId] = settleTriggerOwnership(state, createRegistry(), true, 'trigger');

      expect(lostTriggerId).toBe('trigger');
    });

    it('keeps a pending owner that has not registered yet', () => {
      const state = createState({ activeTriggerId: 'pending', resolvedTriggerId: 'previous' });

      const [changes, lostTriggerId] = settleTriggerOwnership(
        state,
        createRegistry(['other', createElement()]),
        true,
        'pending',
      );

      expect(lostTriggerId).toBe(null);
      expect(changes.activeTriggerId).toBeUndefined();
      expect(changes.resolvedTriggerId).toBe(null);
    });

    it('claims a lone registered trigger for an unowned popup', () => {
      const element = createElement();

      const [changes] = settleTriggerOwnership(
        createState(),
        createRegistry(['trigger', element]),
        true,
        null,
      );

      expect(changes.activeTriggerId).toBe('trigger');
      expect(changes.activeTriggerElement).toBe(element);
      expect(changes.resolvedTriggerId).toBe('trigger');
      expect(changes.hasLoneTrigger).toBe(true);
    });

    it('does not claim a lone trigger for a popup opened without a trigger, or among several', () => {
      const element = createElement();

      expect(
        settleTriggerOwnership(
          createState({ openedWithoutTrigger: true }),
          createRegistry(['trigger', element]),
          true,
          null,
        )[0].activeTriggerId,
      ).toBeUndefined();
      expect(
        settleTriggerOwnership(
          createState(),
          createRegistry(['first', element], ['second', createElement()]),
          true,
          null,
        )[0].activeTriggerId,
      ).toBeUndefined();
    });

    it('does not claim another trigger when the owner was lost', () => {
      const state = createState({ activeTriggerId: 'owner', resolvedTriggerId: 'owner' });

      const [changes, lostTriggerId] = settleTriggerOwnership(
        state,
        createRegistry(['other', createElement()]),
        true,
        'owner',
      );

      expect(lostTriggerId).toBe('owner');
      expect(changes.activeTriggerId).toBeUndefined();
    });

    it('follows a controlled owner id over the stored one', () => {
      const owner = createElement();
      const lone = createElement();

      // A controlled owner that hasn't registered keeps a lone trigger from claiming the popup.
      const [pendingChanges, pendingLost] = settleTriggerOwnership(
        createState(),
        createRegistry(['lone', lone]),
        true,
        'owner',
      );
      expect(pendingLost).toBe(null);
      expect(pendingChanges.activeTriggerId).toBeUndefined();
      expect(pendingChanges.resolvedTriggerId).toBe(null);

      // A registered controlled owner resolves and provides the element; the stored id stays.
      const [changes] = settleTriggerOwnership(
        createState(),
        createRegistry(['owner', owner]),
        true,
        'owner',
      );
      expect(changes.activeTriggerId).toBeUndefined();
      expect(changes.activeTriggerElement).toBe(owner);
      expect(changes.resolvedTriggerId).toBe('owner');
    });
  });
});
