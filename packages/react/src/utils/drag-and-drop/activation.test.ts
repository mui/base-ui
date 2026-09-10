import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ACTIVATION,
  evaluateActivation,
  getActivationDelayMs,
  resolveActivation,
} from './activation';

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
      // Movement under the 5px default does not cancel the hold: still pending
      // before the delay, activating once it elapses.
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 4, y: 0 }, 100)).toBe('pending');
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 4, y: 0 }, 250)).toBe('activate');
      // Movement over the default cancels, exactly as an explicit `tolerance: 5` would.
      expect(evaluateActivation(activation, { x: 0, y: 0 }, { x: 6, y: 0 }, 100)).toBe('cancel');
    });
  });

  describe('getActivationDelayMs', () => {
    it('returns the delay only for press-hold', () => {
      expect(getActivationDelayMs({ type: 'immediate' })).toBeNull();
      expect(getActivationDelayMs({ type: 'distance', distance: 5 })).toBeNull();
      expect(getActivationDelayMs({ type: 'press-hold', delay: 250, tolerance: 5 })).toBe(250);
    });
  });

  describe('resolveActivation', () => {
    it('returns a single DragActivation when passed directly', () => {
      const explicit = { type: 'immediate' } as const;
      expect(resolveActivation(explicit, 'touch')).toBe(explicit);
    });

    it('uses the per-pointerType override when provided', () => {
      const map = {
        touch: { type: 'distance', distance: 15 } as const,
      };
      expect(resolveActivation(map, 'touch')).toEqual({ type: 'distance', distance: 15 });
      // A pointer type the partial map does not cover falls back to its own
      // per-type default, not to another entry of the map.
      expect(resolveActivation(map, 'mouse')).toEqual(DEFAULT_ACTIVATION.mouse);
    });

    it('falls back to defaults by pointer type', () => {
      expect(resolveActivation(undefined, 'mouse')).toEqual(DEFAULT_ACTIVATION.mouse);
      expect(resolveActivation(undefined, 'pen')).toEqual(DEFAULT_ACTIVATION.pen);
      expect(resolveActivation(undefined, 'touch')).toEqual(DEFAULT_ACTIVATION.touch);
    });
  });
});
