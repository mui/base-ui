import { createDOMRect } from './layoutMocks';

/**
 * Replaces `ResizeObserver` with one whose notifications a test dispatches by hand, so a
 * measurement can be delivered for a specific element at a specific moment.
 */
export function mockResizeObserver() {
  const originalResizeObserver = window.ResizeObserver;
  const observers = new Set<TestResizeObserver>();

  class TestResizeObserver implements ResizeObserver {
    readonly elements = new Set<Element>();

    constructor(readonly callback: ResizeObserverCallback) {
      observers.add(this);
    }

    observe(element: Element) {
      this.elements.add(element);
    }

    unobserve(element: Element) {
      this.elements.delete(element);
    }

    disconnect() {
      this.elements.clear();
      observers.delete(this);
    }

    takeRecords() {
      return [];
    }
  }

  window.ResizeObserver = TestResizeObserver;

  return {
    notify(element: HTMLElement, height: number) {
      const size = { blockSize: height, inlineSize: element.clientWidth };
      const entry = {
        borderBoxSize: [size],
        contentBoxSize: [size],
        contentRect: createDOMRect({ height, width: element.clientWidth }),
        devicePixelContentBoxSize: [size],
        target: element,
      } satisfies ResizeObserverEntry;

      observers.forEach((observer) => {
        if (observer.elements.has(element)) {
          observer.callback([entry], observer);
        }
      });
    },
    restore() {
      window.ResizeObserver = originalResizeObserver;
    },
  };
}
