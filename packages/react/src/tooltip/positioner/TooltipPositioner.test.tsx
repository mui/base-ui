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
    it('places the tooltip on the top side by default', async () => {
      await render(
        <Tooltip.Root open>
          <Trigger style={{ marginTop: 200 }}>Trigger</Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner data-testid="positioner" />
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      expect(screen.getByTestId('positioner')).toHaveAttribute('data-side', 'top');
    });

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
    render,
    viewport: true,
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

  it('passes the same state object while nothing it holds changes', async () => {
    const states: Tooltip.Positioner.State[] = [];

    function App({ label }: { label: string }) {
      return (
        <Tooltip.Root open>
          <Trigger>Trigger</Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner
              render={(props, state) => {
                states.push(state);
                return <div {...props} />;
              }}
            >
              <Tooltip.Popup>{label}</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      );
    }

    const { setProps } = await render(<App label="first" />);
    const stateBefore = states.at(-1);

    await setProps({ label: 'second' });

    expect(states.length).toBeGreaterThan(1);
    expect(states.at(-1)).toBe(stateBefore);
  });
});
