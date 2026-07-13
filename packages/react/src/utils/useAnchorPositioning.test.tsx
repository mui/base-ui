import { expect, vi } from 'vitest';
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

function TestUseAnchorPositioning(props: { shift?: 0 | 1 | 2 | 3 }) {
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
    shift: props.shift,
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

  beforeEach(() => {
    shiftSpy.mockClear();
  });

  it('uses the visual viewport for shift by default', async () => {
    await render(<TestUseAnchorPositioning />);

    expect(shiftSpy.mock.calls[0]?.[0].rootBoundary).toBe(undefined);
  });

  it.each([2, 3] as const)(
    'uses the layout viewport for shift when the shift flags are %s',
    async (shift) => {
      await render(<TestUseAnchorPositioning shift={shift} />);

      expect(shiftSpy.mock.calls[0]?.[0].rootBoundary).toBe('layoutViewport');
    },
  );
});
