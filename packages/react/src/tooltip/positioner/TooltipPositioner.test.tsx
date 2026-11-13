import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, positionerConformanceTests } from '#test-utils';

const Trigger = React.forwardRef(function Trigger(
  props: Tooltip.Trigger.Props,
  ref: React.ForwardedRef<any>,
) {
  return <Tooltip.Trigger {...props} ref={ref} render={<div />} />;
});

describe('<Tooltip.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<Tooltip.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Tooltip.Root open>
          <Tooltip.Portal>{node}</Tooltip.Portal>
        </Tooltip.Root>,
      );
    },
  }));

  describe('prop: side', () => {
    it('uses the side prop over the default', async () => {
      await render(
        <Tooltip.Root open>
          <Trigger>Trigger</Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner data-testid="positioner" side="bottom" />
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      expect(screen.getByTestId('positioner')).toHaveAttribute('data-side', 'bottom');
    });
  });

  it('throws a descriptive error when rendered outside <Tooltip.Root>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Tooltip.Positioner />)).rejects.toThrow(
        'Base UI: TooltipRootContext is missing. Tooltip parts must be placed within <Tooltip.Root>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('throws a descriptive error when rendered outside <Tooltip.Portal>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Tooltip.Root open>
            <Tooltip.Positioner />
          </Tooltip.Root>,
        ),
      ).rejects.toThrow('Base UI: <Tooltip.Portal> is missing.');
    } finally {
      errorSpy.mockRestore();
    }
  });

  positionerConformanceTests({
    triggerSwitch: {
      ...Tooltip,
      // `pointerEvents` keeps the real pointer off the triggers, and `closeDelay` keeps the
      // popup open while the pointer moves to the other trigger.
      triggerProps: { delay: 0, closeDelay: 100, style: { pointerEvents: 'none' } },
      interaction: 'hover',
    },
    render,
    viewport: true,
    defaultSide: 'top',
    defaultCollisionAvoidance: 'popup',
    createComponent: ({ root, trigger, positioner, popup, viewport }) => (
      <Tooltip.Root {...root}>
        <Trigger {...trigger}>Trigger</Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner {...positioner}>
            <Tooltip.Popup {...popup}>
              {viewport ? <Tooltip.Viewport>Popup</Tooltip.Viewport> : 'Popup'}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ),
  });
});
