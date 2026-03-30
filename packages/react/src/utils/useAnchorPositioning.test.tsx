import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { createRenderer } from '#test-utils';
import { useAnchorPositioning } from './useAnchorPositioning';

const shiftSpy = vi.hoisted(() => vi.fn());

vi.mock('../floating-ui-react', async () => {
  const actual =
    await vi.importActual<typeof import('../floating-ui-react')>('../floating-ui-react');

  return {
    ...actual,
    shift: ((...args: Parameters<typeof actual.shift>) => {
      shiftSpy(...args);
      return actual.shift(...args);
    }) satisfies typeof actual.shift,
  };
});

function TestUseAnchorPositioning() {
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const positioning = useAnchorPositioning({
    anchor: anchorRef,
    mounted: true,
    positionMethod: 'absolute',
    side: 'bottom',
    align: 'center',
    sideOffset: 0,
    alignOffset: 0,
    collisionBoundary: 'clipping-ancestors',
    collisionPadding: 5,
    sticky: false,
    arrowPadding: 5,
    disableAnchorTracking: false,
    keepMounted: false,
    collisionAvoidance: { fallbackAxisSide: 'none' },
  });

  return (
    <React.Fragment>
      <div ref={anchorRef}>anchor</div>
      <div ref={positioning.refs.setFloating}>floating</div>
    </React.Fragment>
  );
}

describe('useAnchorPositioning', () => {
  const { render } = createRenderer();
  const visualViewportDescriptor = Object.getOwnPropertyDescriptor(window, 'visualViewport');

  function setVisualViewportScale(scale: number) {
    Object.defineProperty(window, 'visualViewport', {
      value: {
        scale,
        width: window.innerWidth,
        height: window.innerHeight,
        addEventListener: () => {},
        removeEventListener: () => {},
      },
      configurable: true,
    });
  }

  beforeEach(() => {
    shiftSpy.mockClear();
    setVisualViewportScale(1);
  });

  afterEach(() => {
    if (visualViewportDescriptor) {
      Object.defineProperty(window, 'visualViewport', visualViewportDescriptor);
    } else {
      Reflect.deleteProperty(window, 'visualViewport');
    }
  });

  it('does not use the layout viewport for shift by default', async () => {
    await render(<TestUseAnchorPositioning />);

    const shiftOptionsFactory = shiftSpy.mock.calls[0]?.[0];

    expect(shiftOptionsFactory).toBeInstanceOf(Function);

    const floating = document.createElement('div');
    const options = shiftOptionsFactory({
      elements: {
        floating,
      },
    });

    expect(options.rootBoundary).toBe(undefined);
  });

  it('uses the layout viewport for shift when pinch-zoomed', async () => {
    const docEl = document.documentElement;
    const clientHeightDescriptor = Object.getOwnPropertyDescriptor(docEl, 'clientHeight');
    const clientWidthDescriptor = Object.getOwnPropertyDescriptor(docEl, 'clientWidth');

    if (!clientHeightDescriptor || clientHeightDescriptor.configurable) {
      Object.defineProperty(docEl, 'clientHeight', { value: 720, configurable: true });
    }

    if (!clientWidthDescriptor || clientWidthDescriptor.configurable) {
      Object.defineProperty(docEl, 'clientWidth', { value: 1280, configurable: true });
    }

    try {
      setVisualViewportScale(2);

      await render(<TestUseAnchorPositioning />);

      const shiftOptionsFactory = shiftSpy.mock.calls[0]?.[0];

      expect(shiftOptionsFactory).toBeInstanceOf(Function);

      const floating = document.createElement('div');
      const options = shiftOptionsFactory({
        elements: {
          floating,
        },
      });

      expect(options.rootBoundary).toEqual({
        x: 0,
        y: 0,
        width: 1280,
        height: 720,
      });
    } finally {
      if (clientHeightDescriptor) {
        Object.defineProperty(docEl, 'clientHeight', clientHeightDescriptor);
      } else {
        Reflect.deleteProperty(docEl, 'clientHeight');
      }

      if (clientWidthDescriptor) {
        Object.defineProperty(docEl, 'clientWidth', clientWidthDescriptor);
      } else {
        Reflect.deleteProperty(docEl, 'clientWidth');
      }
    }
  });
});
