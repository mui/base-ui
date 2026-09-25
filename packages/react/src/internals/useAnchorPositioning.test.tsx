import { expect, vi, describe, beforeEach, it } from 'vitest';
import * as React from 'react';
import { createRenderer } from '#test-utils';
import { useFloating } from '../../test/floating-ui-tests/useFloating';
import { useAnchorPositioningWithHook } from './useAnchorPositioning';
import type { UseAnchorPositioningParameters } from './useAnchorPositioning';

const { autoUpdateSpy, shiftSpy } = vi.hoisted(() => ({
  autoUpdateSpy: vi.fn(),
  shiftSpy: vi.fn(),
}));

vi.mock('../floating-ui-react', async () => {
  const actual =
    await vi.importActual<typeof import('../floating-ui-react')>('../floating-ui-react');

  return {
    ...actual,
    autoUpdate: ((...args: Parameters<typeof actual.autoUpdate>) => {
      autoUpdateSpy(...args);
      return () => {};
    }) satisfies typeof actual.autoUpdate,
    shift: ((...args: Parameters<typeof actual.shift>) => {
      shiftSpy(...args);
      return actual.shift(...args);
    }) satisfies typeof actual.shift,
  };
});

function TestUseAnchorPositioning(props: {
  shift?: UseAnchorPositioningParameters['shift'];
  updatePositionStrategy?: UseAnchorPositioningParameters['updatePositionStrategy'];
  disableAnchorTracking?: boolean;
}) {
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const positioning = useAnchorPositioningWithHook(
    {
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
      disableAnchorTracking: props.disableAnchorTracking ?? false,
      updatePositionStrategy: props.updatePositionStrategy,
      keepMounted: false,
      collisionAvoidance: { fallbackAxisSide: 'none' },
      shift: props.shift,
    },
    useFloating,
  );

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
    autoUpdateSpy.mockClear();
    shiftSpy.mockClear();
  });

  it('uses the visual viewport for shift by default', async () => {
    await render(<TestUseAnchorPositioning />);

    expect(shiftSpy).toHaveBeenCalled();
    expect(shiftSpy.mock.calls[0]?.[0].rootBoundary).toBe(undefined);
  });

  it.each([
    { shift: { rootBoundary: 'layoutViewport' } as const, crossAxis: false },
    { shift: { crossAxis: true, rootBoundary: 'layoutViewport' } as const, crossAxis: true },
  ])('uses the configured shift options', async ({ shift, crossAxis }) => {
    await render(<TestUseAnchorPositioning shift={shift} />);

    expect(shiftSpy.mock.calls[0]?.[0].rootBoundary).toBe('layoutViewport');
    expect(shiftSpy.mock.calls[0]?.[0].crossAxis).toBe(crossAxis);
  });

  it('enables animation frame updates when updatePositionStrategy is always', async () => {
    await render(<TestUseAnchorPositioning updatePositionStrategy="always" />);

    expect(autoUpdateSpy).toHaveBeenCalled();
    expect(autoUpdateSpy.mock.calls[0]?.[3]).toMatchObject({ animationFrame: true });
  });

  it('keeps the default autoUpdate options unchanged', async () => {
    await render(<TestUseAnchorPositioning />);

    expect(autoUpdateSpy).toHaveBeenCalled();
    expect(autoUpdateSpy.mock.calls[0]?.[3]).toEqual({
      ancestorScroll: true,
      elementResize: typeof ResizeObserver !== 'undefined',
      layoutShift: typeof IntersectionObserver !== 'undefined',
    });
  });

  it('does not track the anchor when disableAnchorTracking is true', async () => {
    await render(
      <TestUseAnchorPositioning updatePositionStrategy="always" disableAnchorTracking />,
    );

    expect(autoUpdateSpy).toHaveBeenCalled();
    expect(autoUpdateSpy.mock.calls[0]?.[3]).toEqual({
      ancestorScroll: false,
      elementResize: false,
      layoutShift: false,
    });
  });
});
