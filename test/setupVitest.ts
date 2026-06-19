import setupVitest from '@mui/internal-test-utils/setupVitest';
import '@testing-library/jest-dom/vitest';
import { onTestFinished, vi } from 'vitest';
import { reset } from '@base-ui/utils/error';

declare global {
  // eslint-disable-next-line vars-on-top
  var BASE_UI_ANIMATIONS_DISABLED: boolean;
}

setupVitest();

const isBrowser = typeof window !== 'undefined' && !window.navigator.userAgent.includes('jsdom');

if (isBrowser) {
  // Pin `IS_REACT_ACT_ENVIRONMENT` to `true`. The browser renderer wraps interactions in `act()`
  // to flush effects, but Testing Library's act/event/async wrappers momentarily save and restore
  // this global. Combined with deferred updates from real events (focus management, floating-ui
  // positioning), that restore can briefly expose a stale `false` value while an `act()` is in
  // progress and trigger spurious "not configured to support act(...)" console errors. Keeping it
  // pinned avoids the race while leaving `act()`'s effect flushing intact.
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
    configurable: true,
    get: () => true,
    set: () => {},
  });

  // Browser tests drive components with real user events and timers, so React updates
  // routinely happen outside `act()`. Those "not wrapped in act(...)" warnings are noise
  // in this environment (and would otherwise fail tests via the console guard), so silence
  // them globally. This re-wraps `console.error` per test and restores it afterwards,
  // layering on top of the console guard installed by `setupVitest`.
  // (Inlined rather than using `@mui/internal-test-utils`'s `ignoreActWarnings` to avoid
  // pulling Testing Library's `userEvent` into the non-DOM `docs`/`utils` test setups.)
  beforeEach(() => {
    const originalConsoleError = console.error;
    console.error = new Proxy(originalConsoleError, {
      apply(target, thisArg, args) {
        if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) {
          // Matches both React's "An update to X ... was not wrapped in act(...)" and
          // "A suspended resource finished loading ... was not wrapped in act(...)" warnings.
          return undefined;
        }
        return Reflect.apply(target, thisArg, args);
      },
    });
    onTestFinished(() => {
      console.error = originalConsoleError;
    });
  });
}

afterEach(() => {
  vi.resetAllMocks();
  reset();
});

globalThis.BASE_UI_ANIMATIONS_DISABLED = true;

if (typeof window !== 'undefined' && window?.navigator?.userAgent?.includes('jsdom')) {
  globalThis.requestAnimationFrame = (cb) => {
    setTimeout(() => cb(0), 0);
    return 0;
  };
}
