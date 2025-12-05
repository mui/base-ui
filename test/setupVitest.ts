/* eslint-disable vars-on-top */
import { beforeAll, afterAll } from 'vitest';
import * as chai from 'chai';
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

if (typeof window !== 'undefined') {
  afterEach(async () => {
    const { cleanup } = await import('@mui/internal-test-utils');
    cleanup();
  });
}
