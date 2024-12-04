import { beforeAll, afterAll, vi } from 'vitest';
import chai from 'chai';

import chaiDom from 'chai-dom';
import chaiPlugin from '@mui/internal-test-utils/chaiPlugin';

chai.use(chaiDom);
chai.use(chaiPlugin);

// @ts-ignore
globalThis.before = beforeAll;
// @ts-ignore
globalThis.after = afterAll;

// @ts-ignore
globalThis.vi = vi;

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
    cb(0);
    return 0;
  };
} else if (typeof HTMLElement !== 'undefined') {
  globalThis.originalGetAnimations = HTMLElement.prototype.getAnimations;
  Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
    value: undefined,
    configurable: true,
    writable: true,
  });
}
