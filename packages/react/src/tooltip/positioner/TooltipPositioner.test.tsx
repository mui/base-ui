import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
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
});
