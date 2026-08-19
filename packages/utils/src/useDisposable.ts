'use client';
import * as React from 'react';
import { useOnMount } from './useOnMount';
import { SafeReact } from './safeReact';
import { disposeSymbol } from './disposable';

interface Disposable {
  [disposeSymbol](): void;
}

// React 19 exposes shared internals under `__CLIENT_INTERNALS_…` with the
// fiber under `A.getOwner()`; React 18 exposes them under `__SECRET_INTERNALS_…`
// with the fiber under `ReactCurrentOwner.current`. `mode` is a bitfield on
// the fiber. We key on StrictEffectsMode (16) — the bit a concurrent-root
// `<StrictMode>` sets on React 18/19, and the bit that actually drives the
// mount→unmount→mount effect replay this hook guards against. Setups that
// don't replay effects (legacy-root StrictMode, React 17, Preact) don't set
// it, so they fall through to a single, normal dispose. Bit values are
// React-version-specific; if a future React renumbers them and detection
// misfires, the mount counter throws rather than silently leaking.
const STRICT_MODE_BITS = 0b10000;

interface ReactSharedInternalsLike {
  A?: { getOwner?: (() => { mode?: number | undefined } | null) | undefined } | null | undefined;
  ReactCurrentOwner?:
    { current?: { mode?: number | undefined } | null | undefined } | null | undefined;
}

// Read the internals off `SafeReact` — a plain clone of the React namespace —
// rather than `React` directly. Bundlers rewrite a static
// `React.__SECRET_INTERNALS_…` access into a named import of `react`, which
// errors at build time when the key isn't exported (React 19 drops
// `__SECRET_INTERNALS_…`, React 18 drops `__CLIENT_INTERNALS_…`). Reading off
// the clone keeps it a plain property access the bundler leaves alone.
const SafeReactInternals = SafeReact as unknown as Record<
  string,
  ReactSharedInternalsLike | undefined
>;
const ReactInternals: ReactSharedInternalsLike | undefined =
  // eslint-disable-next-line no-underscore-dangle
  SafeReactInternals.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ??
  // eslint-disable-next-line no-underscore-dangle
  SafeReactInternals.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

function isInStrictMode(): boolean {
  try {
    const owner =
      ReactInternals?.A?.getOwner?.() ?? ReactInternals?.ReactCurrentOwner?.current ?? null;
    if (owner == null || typeof owner.mode !== 'number') {
      return false;
    }
    // eslint-disable-next-line no-bitwise
    return (owner.mode & STRICT_MODE_BITS) !== 0;
  } catch {
    return false;
  }
}

// Module-private symbol used to stash the `useOnMount` callback on the
// instance during the first render so subsequent renders can pass the same
// reference into `useOnMount` without allocating a fresh closure.
const MOUNT = Symbol('useDisposable.mount');

// Module-private symbol holding the dev-only StrictMode bookkeeping that lets
// the mount callback distinguish StrictMode's simulated unmount from a real
// one and assert our render-time detection was correct.
const DEV_STATE = Symbol('useDisposable.devState');

interface DevState {
  // What `isInStrictMode()` reported at construction time.
  detectedStrict: boolean;
  // How many times this instance has been mounted. StrictMode replays the
  // mount→unmount→mount cycle on the *same* instance, so a second mount only
  // ever happens under StrictMode.
  mountCount: number;
  // Whether we've already run the instance's `[disposeSymbol]`.
  disposed: boolean;
}

type Mounted<T> = T & { [MOUNT]: () => (() => void) | undefined };

type MountedDev<T> = T & { [MOUNT]: () => () => void; [DEV_STATE]: DevState };

const UNINITIALIZED: unique symbol = Symbol();

/**
 * Production variant: lazily creates the instance on first render and stashes
 * a single mount/cleanup pair on it under a module-private symbol so render-
 * pass allocations stay at zero after the first render. No StrictMode
 * detection is needed because StrictMode's double-mount only happens in dev.
 * @returns {T} the lazily-created instance.
 */
function useDisposableProduction<T extends Disposable>(factory: () => T): T {
  const ref = React.useRef<Mounted<T> | typeof UNINITIALIZED>(UNINITIALIZED);
  if (ref.current === UNINITIALIZED) {
    const inst = factory() as Mounted<T>;
    const cleanup = () => {
      inst[disposeSymbol]();
      // Reset so a fiber-preserving remount (e.g. `<Activity>` reveal, which
      // re-renders before re-running effects) rebuilds a fresh instance instead
      // of reusing the disposed one.
      ref.current = UNINITIALIZED;
    };
    inst[MOUNT] = () => cleanup;
    ref.current = inst;
  }
  useOnMount(ref.current[MOUNT]);
  return ref.current;
}

/**
 * Development variant: detects StrictMode by reading the currently-rendering
 * fiber's `mode` bits from React shared internals so the same instance
 * survives StrictMode's mount→unmount→mount cycle.
 *
 * The mount callback counts mounts to keep the detection honest:
 * - it skips dispose on StrictMode's *first* (simulated) unmount only, and
 *   disposes on every real unmount — including the final one inside
 *   `<StrictMode>`, so no instance is leaked in dev;
 * - if the instance is mounted a second time but was already disposed, our
 *   render-time detection produced a false negative. Rather than silently
 *   hand back a dead instance (which is the failure that motivated this hook),
 *   it throws so the bug surfaces immediately.
 * @returns {T} the lazily-created instance.
 */
function useDisposableDevelopment<T extends Disposable>(factory: () => T): T {
  const ref = React.useRef<MountedDev<T> | typeof UNINITIALIZED>(UNINITIALIZED);
  if (ref.current === UNINITIALIZED) {
    const inst = factory() as MountedDev<T>;
    // Captured during render because the owner fiber is only set while React
    // is rendering — by the time the effect runs it's already null.
    const state: DevState = { detectedStrict: isInStrictMode(), mountCount: 0, disposed: false };
    inst[DEV_STATE] = state;
    inst[MOUNT] = () => {
      state.mountCount += 1;
      if (state.mountCount > 1 && state.disposed) {
        throw new Error(
          'Base UI: useDisposable failed to detect React StrictMode.\n' +
            "The instance was disposed on StrictMode's simulated unmount and is about to be reused while torn down.\n" +
            'This is an internal invariant violation — please report it at https://github.com/mui/base-ui/issues.',
        );
      }
      return () => {
        // Skip StrictMode's simulated unmount (the first unmount, when strict
        // mode was detected); dispose on every real unmount.
        if (state.detectedStrict && state.mountCount < 2) {
          return;
        }
        state.disposed = true;
        inst[disposeSymbol]();
        // Reset so a fiber-preserving remount (e.g. `<Activity>` reveal, which
        // re-renders before re-running effects) rebuilds a fresh instance
        // instead of reusing the disposed one.
        ref.current = UNINITIALIZED;
      };
    };
    ref.current = inst;
  }
  useOnMount(ref.current[MOUNT]);
  return ref.current;
}

/**
 * Lazily creates an instance on first render and runs its `[disposeSymbol]`
 * once on unmount. The cleanup runs synchronously; in development StrictMode's
 * simulated unmount is detected and skipped so the same instance survives the
 * double mount. The development variant degrades to production behaviour on
 * runtimes that don't replay the double mount (Preact, React 17) because no
 * readable StrictEffectsMode bit is found, so no runtime branching is needed.
 */
export const useDisposable =
  process.env.NODE_ENV === 'production' ? useDisposableProduction : useDisposableDevelopment;
