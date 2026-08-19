import { afterEach, expect, vi } from 'vitest';
import {
  AsyncDisposableStack,
  DisposableStack,
  asyncDisposeSymbol,
  disposeSymbol,
  unwrapSuppressedErrors,
} from './disposable';

describe('disposable', () => {
  describe('disposeSymbol / asyncDisposeSymbol', () => {
    it('should export disposeSymbol as a symbol', () => {
      expect(typeof disposeSymbol).toBe('symbol');
    });

    it('should export asyncDisposeSymbol as a symbol', () => {
      expect(typeof asyncDisposeSymbol).toBe('symbol');
    });

    it('should let `[disposeSymbol]() {}` class syntax key methods correctly', () => {
      class Disposable {
        public ran = false;

        [disposeSymbol]() {
          this.ran = true;
        }
      }
      const instance = new Disposable();
      instance[disposeSymbol]();
      expect(instance.ran).toBe(true);
    });

    it('should let DisposableStack#use find a method keyed on disposeSymbol', () => {
      let ran = false;
      const stack = new DisposableStack();
      stack.use({
        [disposeSymbol]() {
          ran = true;
        },
      });
      stack.dispose();
      expect(ran).toBe(true);
    });
  });

  describe('exports', () => {
    it('should export a constructable DisposableStack', () => {
      expect(typeof DisposableStack).toBe('function');
      expect(new DisposableStack().disposed).toBe(false);
    });

    it('should export a constructable AsyncDisposableStack', () => {
      expect(typeof AsyncDisposableStack).toBe('function');
      expect(new AsyncDisposableStack().disposed).toBe(false);
    });
  });

  describe('unwrapSuppressedErrors', () => {
    it('should return a single-element array for a non-SuppressedError', () => {
      const error = new Error('plain');
      expect(unwrapSuppressedErrors(error)).toEqual([error]);
    });

    it('should flatten a SuppressedError chain outermost-first', () => {
      const innermost = new Error('inner');
      const middle = { error: new Error('middle'), suppressed: innermost };
      const outer = { error: new Error('outer'), suppressed: middle };

      const result = unwrapSuppressedErrors(outer);

      expect(result).toHaveLength(3);
      expect((result[0] as Error).message).toBe('outer');
      expect((result[1] as Error).message).toBe('middle');
      expect((result[2] as Error).message).toBe('inner');
    });

    it('should unwrap a real SuppressedError thrown by DisposableStack.dispose', () => {
      const stack = new DisposableStack();
      stack.defer(() => {
        throw new Error('first');
      });
      stack.defer(() => {
        throw new Error('second');
      });

      let caught: unknown;
      try {
        stack.dispose();
      } catch (error) {
        caught = error;
      }

      const result = unwrapSuppressedErrors(caught);
      const messages = result.map((entry) => (entry as Error).message);
      expect(messages).toContain('first');
      expect(messages).toContain('second');
    });
  });
});

// Exercises the built-in fallback classes (not the native `globalThis.DisposableStack`)
// by stubbing the global away and re-importing the module, so the `?? fallback`
// branch is the one under test.
describe('disposable — built-in fallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function loadFallback({ withoutSuppressedError = false } = {}) {
    vi.stubGlobal('DisposableStack', undefined);
    vi.stubGlobal('AsyncDisposableStack', undefined);
    if (withoutSuppressedError) {
      vi.stubGlobal('SuppressedError', undefined);
    }
    vi.resetModules();
    return import('./disposable');
  }

  describe('DisposableStack', () => {
    it('should be constructable and start undisposed', async () => {
      const mod = await loadFallback();
      const stack = new mod.DisposableStack();
      expect(typeof mod.DisposableStack).toBe('function');
      expect(stack.disposed).toBe(false);
      stack.dispose();
      expect(stack.disposed).toBe(true);
    });

    it('should run `use` disposers (keyed on disposeSymbol) in LIFO order', async () => {
      const mod = await loadFallback();
      const order: string[] = [];
      const stack = new mod.DisposableStack();
      stack.use({ [mod.disposeSymbol]: () => order.push('a') });
      stack.use({ [mod.disposeSymbol]: () => order.push('b') });
      stack.dispose();
      expect(order).toEqual(['b', 'a']);
    });

    it('should return the value from `use` and treat null/undefined as a no-op', async () => {
      const mod = await loadFallback();
      const stack = new mod.DisposableStack();
      const resource = { [mod.disposeSymbol]: () => {} };
      expect(stack.use(resource)).toBe(resource);
      expect(stack.use(null)).toBe(null);
      expect(stack.use(undefined)).toBe(undefined);
      expect(() => stack.dispose()).not.toThrow();
    });

    it('should throw a TypeError when `use` receives a non-disposable', async () => {
      const mod = await loadFallback();
      const stack = new mod.DisposableStack();
      expect(() => stack.use({} as any)).toThrow(TypeError);
    });

    it('should pass the value to the `adopt` callback on dispose', async () => {
      const mod = await loadFallback();
      let received: unknown;
      const stack = new mod.DisposableStack();
      expect(
        stack.adopt(42, (value) => {
          received = value;
        }),
      ).toBe(42);
      stack.dispose();
      expect(received).toBe(42);
    });

    it('should dispose only once (idempotent)', async () => {
      const mod = await loadFallback();
      let count = 0;
      const stack = new mod.DisposableStack();
      stack.defer(() => {
        count += 1;
      });
      stack.dispose();
      stack.dispose();
      expect(count).toBe(1);
    });

    it('should transfer ownership with `move` and dispose the original', async () => {
      const mod = await loadFallback();
      const order: string[] = [];
      const stack = new mod.DisposableStack();
      stack.defer(() => order.push('x'));
      const moved = stack.move();
      expect(stack.disposed).toBe(true);
      expect(moved.disposed).toBe(false);
      stack.dispose();
      expect(order).toEqual([]);
      moved.dispose();
      expect(order).toEqual(['x']);
    });

    it('should throw when registering on an already-disposed stack', async () => {
      const mod = await loadFallback();
      const stack = new mod.DisposableStack();
      stack.dispose();
      expect(() => stack.use({ [mod.disposeSymbol]: () => {} })).toThrow();
      expect(() => stack.defer(() => {})).toThrow();
      expect(() => stack.adopt(1, () => {})).toThrow();
      expect(() => stack.move()).toThrow();
    });

    it('should aggregate disposer failures into a SuppressedError chain', async () => {
      const mod = await loadFallback();
      const stack = new mod.DisposableStack();
      stack.defer(() => {
        throw new Error('first');
      });
      stack.defer(() => {
        throw new Error('second');
      });

      let caught: unknown;
      try {
        stack.dispose();
      } catch (error) {
        caught = error;
      }

      const messages = mod.unwrapSuppressedErrors(caught).map((entry) => (entry as Error).message);
      expect(messages).toContain('first');
      expect(messages).toContain('second');
    });

    it('should aggregate failures even when `SuppressedError` is unavailable', async () => {
      const mod = await loadFallback({ withoutSuppressedError: true });
      const stack = new mod.DisposableStack();
      stack.defer(() => {
        throw new Error('first');
      });
      stack.defer(() => {
        throw new Error('second');
      });

      let caught: unknown;
      try {
        stack.dispose();
      } catch (error) {
        caught = error;
      }

      const messages = mod.unwrapSuppressedErrors(caught).map((entry) => (entry as Error).message);
      expect(messages).toContain('first');
      expect(messages).toContain('second');
    });
  });

  describe('AsyncDisposableStack', () => {
    it('should dispose async resources in LIFO order', async () => {
      const mod = await loadFallback();
      const order: string[] = [];
      const stack = new mod.AsyncDisposableStack();
      stack.defer(async () => {
        order.push('a');
      });
      stack.defer(async () => {
        order.push('b');
      });
      expect(stack.disposed).toBe(false);
      await stack.disposeAsync();
      expect(stack.disposed).toBe(true);
      expect(order).toEqual(['b', 'a']);
    });

    it('should let `use` fall back to the sync dispose symbol', async () => {
      const mod = await loadFallback();
      let ran = false;
      const stack = new mod.AsyncDisposableStack();
      stack.use({
        [mod.disposeSymbol]: () => {
          ran = true;
        },
      });
      await stack.disposeAsync();
      expect(ran).toBe(true);
    });
  });
});
