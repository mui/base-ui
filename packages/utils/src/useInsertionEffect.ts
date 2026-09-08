'use client';
import { SafeReact } from './safeReact';

const reactUseInsertionEffect = SafeReact.useInsertionEffect;

/**
 * `React.useInsertionEffect` where it exists and fires in time, or a call during render otherwise.
 *
 * An insertion effect runs in the commit's mutation phase: before every layout-effect setup and
 * ref attachment in the whole tree (though not before layout-effect cleanups or ref detachments,
 * which run in the same mutation phase, descendants first), and never for a render that does not
 * commit. That makes it the phase for publishing values computed during render to code that runs
 * from effects and event handlers: what those readers see is always the committed render's value,
 * never the one of a render that suspended in a transition.
 *
 * Cleanup functions are not supported: the fallback below ignores the return value.
 *
 * React 17 has no insertion effects, and Preact replaces them with layout effects, which fire too
 * late; both fall back to running the callback during render, which is where such values were
 * published before this phase existed.
 */
export const useInsertionEffect: (effect: () => void) => void =
  reactUseInsertionEffect && reactUseInsertionEffect !== SafeReact.useLayoutEffect
    ? reactUseInsertionEffect
    : (effect) => effect();
