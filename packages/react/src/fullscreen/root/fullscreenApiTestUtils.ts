import { vi, type MockInstance } from 'vitest';

interface PrototypeSnapshot {
  hadOwnRequest: boolean;
  ownRequest: PropertyDescriptor | undefined;
  hadOwnExit: boolean;
  ownExit: PropertyDescriptor | undefined;
  hadOwnElement: boolean;
  ownElement: PropertyDescriptor | undefined;
  hadOwnEnabled: boolean;
  ownEnabled: PropertyDescriptor | undefined;
}

export interface FullscreenApiStubs {
  request: MockInstance<(this: HTMLElement, options?: FullscreenOptions) => Promise<void>>;
  exit: MockInstance<(this: Document) => Promise<void>>;
  setEnabled: (enabled: boolean) => void;
  setActiveElement: (element: Element | null) => void;
  dispatchChange: (doc?: Document) => void;
  restore: () => void;
}

function dispatchFullscreenChange(doc: Document) {
  doc.dispatchEvent(new Event('fullscreenchange'));
}

let enabled = true;
let fullscreenElement: Element | null = null;

/**
 * Installs jsdom-friendly fullscreen API stubs that synchronously update
 * `document.fullscreenElement` and resolve their promises. The returned `restore`
 * MUST be called from `afterEach` to clean up prototype mutations.
 */
export function installFullscreenApiStubs(): FullscreenApiStubs {
  const snapshot: PrototypeSnapshot = {
    hadOwnRequest: Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'requestFullscreen'),
    ownRequest: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'requestFullscreen'),
    hadOwnExit: Object.prototype.hasOwnProperty.call(Document.prototype, 'exitFullscreen'),
    ownExit: Object.getOwnPropertyDescriptor(Document.prototype, 'exitFullscreen'),
    hadOwnElement: Object.prototype.hasOwnProperty.call(Document.prototype, 'fullscreenElement'),
    ownElement: Object.getOwnPropertyDescriptor(Document.prototype, 'fullscreenElement'),
    hadOwnEnabled: Object.prototype.hasOwnProperty.call(Document.prototype, 'fullscreenEnabled'),
    ownEnabled: Object.getOwnPropertyDescriptor(Document.prototype, 'fullscreenEnabled'),
  };

  enabled = true;
  fullscreenElement = null;

  Object.defineProperty(Document.prototype, 'fullscreenEnabled', {
    configurable: true,
    get: () => enabled,
  });

  Object.defineProperty(Document.prototype, 'fullscreenElement', {
    configurable: true,
    get: () => fullscreenElement,
  });

  // Install plain originals first so vitest can spy on them, then override
  // with the desired implementation. Using `value` writable makes spying work
  // on jsdom prototypes that don't ship the methods.
  Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
    configurable: true,
    writable: true,
    value() {
      return Promise.resolve();
    },
  });
  Object.defineProperty(Document.prototype, 'exitFullscreen', {
    configurable: true,
    writable: true,
    value() {
      return Promise.resolve();
    },
  });

  const request = vi
    .spyOn(HTMLElement.prototype, 'requestFullscreen')
    .mockImplementation(function fakeRequestFullscreen(this: HTMLElement) {
      // eslint-disable-next-line consistent-this
      const target: HTMLElement = this;
      fullscreenElement = target;
      dispatchFullscreenChange(target.ownerDocument);
      return Promise.resolve();
    });

  const exit = vi
    .spyOn(Document.prototype, 'exitFullscreen')
    .mockImplementation(function fakeExitFullscreen(this: Document) {
      // eslint-disable-next-line consistent-this
      const target: Document = this;
      fullscreenElement = null;
      dispatchFullscreenChange(target);
      return Promise.resolve();
    });

  return {
    request,
    exit,
    setEnabled(next: boolean) {
      enabled = next;
    },
    setActiveElement(element: Element | null) {
      fullscreenElement = element;
    },
    dispatchChange(doc: Document = document) {
      dispatchFullscreenChange(doc);
    },
    restore() {
      request.mockRestore();
      exit.mockRestore();

      if (snapshot.hadOwnRequest && snapshot.ownRequest) {
        Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', snapshot.ownRequest);
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'requestFullscreen');
      }

      if (snapshot.hadOwnExit && snapshot.ownExit) {
        Object.defineProperty(Document.prototype, 'exitFullscreen', snapshot.ownExit);
      } else {
        Reflect.deleteProperty(Document.prototype, 'exitFullscreen');
      }

      if (snapshot.hadOwnElement && snapshot.ownElement) {
        Object.defineProperty(Document.prototype, 'fullscreenElement', snapshot.ownElement);
      } else {
        Reflect.deleteProperty(Document.prototype, 'fullscreenElement');
      }

      if (snapshot.hadOwnEnabled && snapshot.ownEnabled) {
        Object.defineProperty(Document.prototype, 'fullscreenEnabled', snapshot.ownEnabled);
      } else {
        Reflect.deleteProperty(Document.prototype, 'fullscreenEnabled');
      }

      enabled = true;
      fullscreenElement = null;
    },
  };
}
