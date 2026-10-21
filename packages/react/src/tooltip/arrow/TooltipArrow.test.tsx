import { expect, describe, it } from 'vitest';
import { Tooltip } from '@base-ui/react/tooltip';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import {
  createRenderer,
  describeConformance,
  isJSDOM,
  recordTransitions,
  waitSingleFrame,
} from '#test-utils';

import demoStyles from 'docs/src/app/(docs)/react/components/tooltip/demos/detached-triggers-full/css-modules/index.module.css';

describe('<Tooltip.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(<Tooltip.Arrow />, () => ({
    refInstanceof: window.Element,
    render(node) {
      return render(
        <Tooltip.Root open>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>{node}</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );
    },
  }));

  function ArrowTooltip({
    arrowPadding,
    triggerWidth = 20,
  }: {
    arrowPadding?: number;
    triggerWidth?: number;
  }) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0 }}>
        <Tooltip.Root open>
          <Tooltip.Trigger style={{ width: triggerWidth, height: 20 }}>T</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner side="bottom" arrowPadding={arrowPadding}>
              <Tooltip.Popup style={{ width: 200, height: 40 }}>
                <Tooltip.Arrow data-testid="arrow" style={{ width: 10, height: 10 }} />
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    );
  }

  it('is hidden from assistive technology and mirrors the resolved side', async () => {
    await render(<ArrowTooltip />);

    const arrow = screen.getByTestId('arrow');

    expect(arrow).toHaveAttribute('aria-hidden', 'true');
    expect(arrow).toHaveAttribute('data-side', 'bottom');
    expect(arrow).toHaveAttribute('data-open');
  });

  it.skipIf(isJSDOM)('is marked uncentered when it cannot point at the anchor', async () => {
    await render(<ArrowTooltip arrowPadding={40} />);

    expect(screen.getByTestId('arrow')).toHaveAttribute('data-uncentered');
  });

  it.skipIf(isJSDOM)('is not marked uncentered when it can point at the anchor', async () => {
    await render(<ArrowTooltip arrowPadding={0} triggerWidth={200} />);

    expect(screen.getByTestId('arrow')).not.toHaveAttribute('data-uncentered');
  });

  it.skipIf(isJSDOM)(
    'keeps the arrow aligned when collision shifting changes its offset',
    async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      await render(
        <Tooltip.Root open triggerId="trigger">
          <Tooltip.Trigger
            id="trigger"
            style={{ position: 'fixed', top: 200, left: 130, width: 20, height: 20 }}
          >
            Trigger
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner
              side="bottom"
              collisionPadding={5}
              data-testid="positioner"
              className={demoStyles.Positioner}
            >
              <Tooltip.Popup data-testid="popup" style={{ width: 200, height: 40 }}>
                <Tooltip.Arrow data-testid="arrow" className={demoStyles.Arrow} />
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );
      const positioner = screen.getByTestId('positioner');
      const arrow = screen.getByTestId('arrow');
      const trigger = screen.getByRole('button');
      await waitFor(() => expect(positioner.style.transition).toBe(''));
      await waitFor(() => expect(arrow.style.left).toBe('94px'));
      const transitions = recordTransitions(arrow);
      expect(positioner).toHaveAttribute('data-instant');
      await act(async () => {
        trigger.style.left = '30px';
      });
      await waitFor(() => expect(arrow.style.left).toBe('29px'));
      await act(async () => {
        await waitSingleFrame();
        await waitSingleFrame();
      });
      expect(transitions.started).toEqual([]);
      expect(arrow.getBoundingClientRect().left + 6).toBeCloseTo(
        trigger.getBoundingClientRect().left + 10,
        0,
      );
    },
  );
});
