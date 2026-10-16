import { beforeAll, vi } from 'vitest';
import setupVitest from '@mui/internal-test-utils/setupVitest';
// eslint-disable-next-line import/no-relative-packages
import '../packages/react/test/addVitestMatchers';
import '@testing-library/jest-dom/vitest';
import { reset as resetBuiltError } from '@base-ui/utils/error';
import { resetAnimationFrameScheduler as resetBuiltScheduler } from '@base-ui/utils/useAnimationFrame';

declare global {
  // eslint-disable-next-line vars-on-top
  var BASE_UI_ANIMATIONS_DISABLED: boolean;
}

let resetSourceError = () => {};
let resetSourceScheduler = () => {};

setupVitest();

beforeAll(async () => {
  // In compiler tests with workspace aliases disabled, the source module and package entry
  // can be loaded as separate instances, so reset the source copy too.
  // eslint-disable-next-line import/no-relative-packages
  ({ reset: resetSourceError } = await import('../packages/utils/src/error'));
  ({ resetAnimationFrameScheduler: resetSourceScheduler } = await import(
    // eslint-disable-next-line import/no-relative-packages
    '../packages/utils/src/useAnimationFrame'
  ));
});

afterEach(() => {
  vi.resetAllMocks();
  globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  // `warn` and `error` share one log-once store, so this also clears deduplicated warnings.
  resetBuiltError();
  resetSourceError();
  // Drop animation frame callbacks that were scheduled but never ran (e.g. under fake timers torn
  // down before the frame fired). The scheduler is process-global, so without this they would leak
  // into a later test and run there against stale state.
  resetBuiltScheduler();
  resetSourceScheduler();
});

globalThis.BASE_UI_ANIMATIONS_DISABLED = true;

if (typeof window !== 'undefined' && window?.navigator?.userAgent?.includes('jsdom')) {
  // Return the timer's id as the frame handle, so `cancelAnimationFrame` cancels it as it does in a
  // browser. jsdom's own `cancelAnimationFrame` does not know these handles.
  globalThis.requestAnimationFrame = (cb) => Number(setTimeout(() => cb(0), 0));
  globalThis.cancelAnimationFrame = (handle) => clearTimeout(handle);
}
