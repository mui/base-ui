import { expect, vi, describe, beforeEach, it } from 'vitest';
import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import { useFloating } from '../floating-ui-react';
import {
  useAnchorPositioningWithHook,
  type UseAnchorPositioningParameters,
} from './useAnchorPositioning';

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

function TestUseAnchorPositioning(props: { shift?: UseAnchorPositioningParameters['shift'] }) {
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
      disableAnchorTracking: false,
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

function TestLazyFlip(props: { side?: 'right' | 'bottom'; align?: 'start' | 'center' }) {
  const { side = 'right', align = 'start' } = props;
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [shrunk, setShrunk] = React.useState(false);
  const height = shrunk ? 10 : 100;

  const positioning = useAnchorPositioningWithHook(
    {
      anchor: anchorRef,
      mounted: true,
      positionMethod: 'fixed',
      side,
      align,
      sideOffset: 0,
      alignOffset: 0,
      collisionBoundary: 'clipping-ancestors',
      collisionPadding: 5,
      sticky: false,
      arrowPadding: 5,
      disableAnchorTracking: false,
      keepMounted: false,
      collisionAvoidance: { fallbackAxisSide: 'none' },
      lazyFlip: true,
    },
    useFloating,
  );

  return (
    <React.Fragment>
      <div
        ref={anchorRef}
        data-testid="anchor"
        style={{ position: 'fixed', right: 200, bottom: 10, width: 20, height: 20 }}
      >
        anchor
      </div>
      <div
        ref={positioning.refs.setFloating}
        data-testid="floating"
        data-side={positioning.side}
        data-align={positioning.align}
        style={{ ...positioning.positionerStyles, width: 100, height }}
      >
        floating
      </div>
      <button type="button" onClick={() => setShrunk(true)}>
        Shrink
      </button>
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

  it.skipIf(isJSDOM)('locks a flipped alignment after the popup shrinks', async () => {
    const { user } = await render(<TestLazyFlip />);
    const floating = screen.getByTestId('floating');

    await waitFor(() => {
      expect(floating).toHaveAttribute('data-align', 'end');
    });

    await user.click(screen.getByRole('button', { name: 'Shrink' }));

    await waitFor(() => {
      const anchorBottom = screen.getByTestId('anchor').getBoundingClientRect().bottom;
      const floatingBottom = floating.getBoundingClientRect().bottom;
      expect(Math.abs(anchorBottom - floatingBottom)).toBeLessThan(1);
    });

    expect(floating).toHaveAttribute('data-align', 'end');
  });

  it.skipIf(isJSDOM)('locks a flipped side after the popup shrinks', async () => {
    const { user } = await render(<TestLazyFlip side="bottom" align="center" />);
    const floating = screen.getByTestId('floating');

    // The anchor sits at the viewport's bottom edge, so the popup flips above it.
    await waitFor(() => {
      expect(floating).toHaveAttribute('data-side', 'top');
    });

    // Shrinking makes the preferred bottom side fit again, but the flip is locked.
    await user.click(screen.getByRole('button', { name: 'Shrink' }));

    await waitFor(() => {
      const anchorTop = screen.getByTestId('anchor').getBoundingClientRect().top;
      const floatingBottom = floating.getBoundingClientRect().bottom;
      expect(Math.abs(anchorTop - floatingBottom)).toBeLessThan(1);
    });

    expect(floating).toHaveAttribute('data-side', 'top');
  });
});
