import { describe, expect, it } from 'vitest';
import {
  evaluateActivation,
  evaluateActivations,
  getActivationDelayMs,
  hasDoubleClickActivation,
  resolveActivation,
} from './activation';

// The documented defaults, spelled out so a changed default fails here.
const DEFAULTS = {
  mouse: { type: 'distance', distance: 5 },
  pen: { type: 'distance', distance: 5 },
  touch: { type: 'press-hold', delay: 250 },
} as const;

describe('activation', () => {
  describe('evaluateActivation', () => {
    it('immediate activates at pointerdown', () => {
      const decision = evaluateActivation({ type: 'immediate' }, { x: 0, y: 0 }, { x: 0, y: 0 }, 0);
      expect(decision).toBe('activate');
    });

    it('distance stays pending until threshold crossed', () => {
      const activation = { type: 'distance', distance: 5 } as const;
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 0, y: 0 }, 0)).toBe('pending');
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 3, y: 3 }, 0)).toBe('pending');
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 4, y: 4 }, 0)).toBe('activate');
    });

    it('distance activates at exactly the threshold (inclusive comparison)', () => {
      const activation = { type: 'distance', distance: 5 } as const;
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 5, y: 0 }, 0)).toBe('activate');
    });

    it('press-hold is pending before delay expires', () => {
      const activation = { type: 'press-hold', delay: 250, tolerance: 5 } as const;
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 0, y: 0 }, 0)).toBe('pending');
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 0, y: 0 }, 100)).toBe('pending');
    });

    it('press-hold activates once elapsed exceeds delay and movement stays under tolerance', () => {
      const activation = { type: 'press-hold', delay: 250, tolerance: 5 } as const;
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 2, y: 2 }, 250)).toBe('activate');
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 2, y: 2 }, 300)).toBe('activate');
    });

    it('press-hold cancels if movement exceeds tolerance before delay', () => {
      const activation = { type: 'press-hold', delay: 250, tolerance: 5 } as const;
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 10, y: 0 }, 100)).toBe('cancel');
    });

    it('press-hold tolerates movement of exactly the tolerance (strict comparison)', () => {
      const activation = { type: 'press-hold', delay: 250, tolerance: 5 } as const;
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 5, y: 0 }, 100)).toBe('pending');
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 5, y: 0 }, 250)).toBe('activate');
    });

    it('press-hold cancels even after delay if movement exceeded tolerance', () => {
      const activation = { type: 'press-hold', delay: 250, tolerance: 5 } as const;
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 10, y: 0 }, 500)).toBe('cancel');
    });

    it('press-hold defaults tolerance to 5px when omitted', () => {
      const activation = { type: 'press-hold', delay: 250 } as const;
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 4, y: 0 }, 100)).toBe('pending');
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 4, y: 0 }, 250)).toBe('activate');
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 6, y: 0 }, 100)).toBe('cancel');
    });
  });

  describe('getActivationDelayMs', () => {
    it('returns the delay only for press-hold', () => {
      expect(getActivationDelayMs([{ type: 'immediate' }])).toBeNull();
      expect(getActivationDelayMs([{ type: 'distance', distance: 5 }])).toBeNull();
      expect(getActivationDelayMs([{ type: 'press-hold', delay: 250, tolerance: 5 }])).toBe(250);
    });
  });

  describe('resolveActivation', () => {
    it('resolves a single configuration', () => {
      const explicit = { type: 'immediate' } as const;
      expect(resolveActivation(explicit, 'touch')).toEqual([explicit]);
    });

    it('uses the per-pointerType override when provided', () => {
      const map = {
        touch: { type: 'distance', distance: 15 } as const,
      };
      expect(resolveActivation(map, 'touch')).toEqual([{ type: 'distance', distance: 15 }]);
      // A pointer type the partial map does not cover falls back to its own
      // per-type default, not to another entry of the map.
      expect(resolveActivation(map, 'mouse')).toEqual([DEFAULTS.mouse]);
    });

    it('falls back to defaults by pointer type', () => {
      expect(resolveActivation(undefined, 'mouse')).toEqual([DEFAULTS.mouse]);
      expect(resolveActivation(undefined, 'pen')).toEqual([DEFAULTS.pen]);
      expect(resolveActivation(undefined, 'touch')).toEqual([DEFAULTS.touch]);
    });
  });
  it('resolves multiple alternatives and excludes double-click from pointer presses', () => {
    const config = [
      { type: 'double-click' },
      { mouse: { type: 'distance', distance: 9 } },
    ] as const;
    expect(resolveActivation(config, 'mouse')).toEqual([{ type: 'distance', distance: 9 }]);
    expect(hasDoubleClickActivation(config, 'mouse')).toBe(true);
    expect(resolveActivation({ type: 'double-click' }, 'mouse')).toEqual([]);
    expect(resolveActivation([], 'touch')).toEqual([]);
  });

  it('applies the per-pointer default once across an array, only when nothing addresses the pointer', () => {
    // The double-click entry addresses mouse, so the touch-only entry doesn't
    // bring in the distance default. A plain drag must not pick the item up.
    expect(
      resolveActivation(
        [{ mouse: { type: 'double-click' } }, { touch: { type: 'press-hold', delay: 500 } }],
        'mouse',
      ),
    ).toEqual([]);
    expect(
      resolveActivation(
        [{ mouse: { type: 'double-click' } }, { touch: { type: 'press-hold', delay: 500 } }],
        'touch',
      ),
    ).toEqual([{ type: 'press-hold', delay: 500 }]);
    // No entry addresses pen, so it gets one default, not one per entry.
    expect(
      resolveActivation(
        [{ mouse: { type: 'double-click' } }, { touch: { type: 'press-hold', delay: 500 } }],
        'pen',
      ),
    ).toEqual([DEFAULTS.pen]);
    expect(resolveActivation([{ mouse: { type: 'distance', distance: 9 } }], 'touch')).toEqual([
      DEFAULTS.touch,
    ]);
    // An empty array disables pickup rather than restoring the default.
    expect(resolveActivation([], 'mouse')).toEqual([]);
  });

  it('reports double-click activation per pointer type', () => {
    expect(hasDoubleClickActivation(undefined, 'mouse')).toBe(false);
    expect(hasDoubleClickActivation({ type: 'distance', distance: 5 }, 'mouse')).toBe(false);
    // A single value applies to every pointer type.
    expect(hasDoubleClickActivation({ type: 'double-click' }, 'mouse')).toBe(true);
    expect(hasDoubleClickActivation({ type: 'double-click' }, 'touch')).toBe(true);
    expect(hasDoubleClickActivation({ type: 'double-click' }, 'pen')).toBe(true);
    // A per-pointer map opts in each type separately.
    expect(hasDoubleClickActivation({ touch: { type: 'double-click' } }, 'touch')).toBe(true);
    expect(hasDoubleClickActivation({ touch: { type: 'double-click' } }, 'mouse')).toBe(false);
    expect(
      hasDoubleClickActivation(
        [{ mouse: { type: 'distance', distance: 5 } }, { pen: { type: 'double-click' } }],
        'pen',
      ),
    ).toBe(true);
  });

  it.each(['mouse', 'touch', 'pen'] as const)(
    'disables %s without disabling other pointer types',
    (pointerType) => {
      const config = { [pointerType]: false } as const;
      expect(resolveActivation(config, pointerType)).toEqual([]);
      expect(hasDoubleClickActivation(config, pointerType)).toBe(false);
      const otherTypes = (['mouse', 'touch', 'pen'] as const).filter(
        (type) => type !== pointerType,
      );
      for (const otherType of otherTypes) {
        expect(resolveActivation(config, otherType)).toEqual([DEFAULTS[otherType]]);
      }
    },
  );

  it.each(['mouse', 'touch', 'pen'] as const)(
    'lets false override every activation method for %s regardless of order',
    (pointerType) => {
      const config = [
        { type: 'immediate' },
        { type: 'double-click' },
        { [pointerType]: false },
      ] as const;
      for (const entries of [config, [...config].reverse()]) {
        expect(resolveActivation(entries, pointerType)).toEqual([]);
        expect(hasDoubleClickActivation(entries, pointerType)).toBe(false);
      }
    },
  );

  it('uses OR semantics when a hold cancels but distance remains pending', () => {
    const config = [
      { type: 'press-hold', delay: 100, tolerance: 2 },
      { type: 'distance', distance: 10 },
    ] as const;
    const first = evaluateActivations(config, { x: 0, y: 0 }, { x: 5, y: 0 }, 20);
    expect(first.activate).toBe(false);
    expect(first.remaining).toEqual([{ type: 'distance', distance: 10 }]);
    expect(evaluateActivations(config, { x: 0, y: 0 }, { x: 10, y: 0 }, 30).activate).toBe(true);
  });

  it('chooses the earliest hold timer', () => {
    expect(
      getActivationDelayMs([
        { type: 'press-hold', delay: 200 },
        { type: 'press-hold', delay: 50 },
      ]),
    ).toBe(50);
  });
});
