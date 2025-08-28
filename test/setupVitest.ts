/* eslint-disable vars-on-top */
import { beforeAll, afterAll } from 'vitest';
import chai from 'chai';
import chaiDom from 'chai-dom';
import chaiPlugin from '@mui/internal-test-utils/chaiPlugin';

import '@testing-library/jest-dom/vitest';

declare global {
  var before: typeof beforeAll;
  var after: typeof afterAll;
  var BASE_UI_ANIMATIONS_DISABLED: boolean;
}

chai.use(chaiDom);
chai.use(chaiPlugin);

// required for conformance tests (until everything is migrated to Vite)
globalThis.before = beforeAll;
globalThis.after = afterAll;

globalThis.BASE_UI_ANIMATIONS_DISABLED = true;

// Force the use of en-US locale to avoid number formatting issues
const OriginalNumberFormat = Intl.NumberFormat;
const originalNumberFormatResolvedOptions = Intl.NumberFormat.prototype.resolvedOptions;

globalThis.Intl.NumberFormat = function MockIntlNumberFormat(locale?: any, options?: any) {
  const forcedLocale = locale === undefined ? 'en-US' : locale;
  return new OriginalNumberFormat(forcedLocale, options);
} as any;

// Mock resolvedOptions to always return en-US
Intl.NumberFormat.prototype.resolvedOptions = function mockIntlNumberFormatResolvedOptions() {
  const options = originalNumberFormatResolvedOptions.call(this);
  return {
    ...options,
    locale: 'en-US',
  };
};

const isVitestJsdom = process.env.VITEST_ENV === 'jsdom';

// Only necessary when not in browser mode.
if (isVitestJsdom) {
  class Touch {
    instance: any;

    constructor(instance: any) {
      this.instance = instance;
    }

    get identifier() {
      return this.instance.identifier;
    }

    get pageX() {
      return this.instance.pageX;
    }

    get pageY() {
      return this.instance.pageY;
    }

    get clientX() {
      return this.instance.clientX;
    }

    get clientY() {
      return this.instance.clientY;
    }
  }
  // @ts-expect-error Touch is not defined on window
  globalThis.window.Touch = Touch;

  globalThis.requestAnimationFrame = (cb) => {
    setTimeout(() => cb(0), 0);
    return 0;
  };
}
