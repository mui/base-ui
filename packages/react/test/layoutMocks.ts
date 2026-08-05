/**
 * Layout mocks for virtualized list tests: fixed client heights, controllable scroll state, and
 * plain DOMRect construction for environments without a layout engine.
 */

export function setElementClientHeight(clientHeight: number) {
  return (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }

    element.style.height = `${clientHeight}px`;
    Object.defineProperty(element, 'clientHeight', {
      configurable: true,
      value: clientHeight,
    });
    Object.defineProperty(element, 'scrollTo', {
      configurable: true,
      value: (options: ScrollToOptions) => {
        element.scrollTop = options.top ?? element.scrollTop;
      },
    });
  };
}

export function setElementScrollState(options: {
  clientHeight: number;
  getScrollTop: () => number;
  scrollTo: (options: ScrollToOptions) => void;
}) {
  return (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }

    element.style.height = `${options.clientHeight}px`;
    Object.defineProperty(element, 'clientHeight', {
      configurable: true,
      value: options.clientHeight,
    });
    Object.defineProperty(element, 'scrollTop', {
      configurable: true,
      get: options.getScrollTop,
    });
    Object.defineProperty(element, 'scrollTo', {
      configurable: true,
      value: options.scrollTo,
    });
  };
}

export function createDOMRect(rect: Partial<DOMRectInit>) {
  return {
    x: rect.x ?? 0,
    y: rect.y ?? 0,
    width: rect.width ?? 0,
    height: rect.height ?? 0,
    top: rect.y ?? 0,
    left: rect.x ?? 0,
    right: (rect.x ?? 0) + (rect.width ?? 0),
    bottom: (rect.y ?? 0) + (rect.height ?? 0),
    toJSON() {
      return this;
    },
  } as DOMRect;
}
