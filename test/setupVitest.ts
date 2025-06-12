/* eslint-disable no-var */
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
  // @ts-expect-error
  globalThis.window.Touch = Touch;

  globalThis.window.scrollTo = () => {};

  globalThis.requestAnimationFrame = (cb) => {
    setTimeout(() => cb(0), 0);
    return 0;
  };
}
