import { expect } from 'vitest';
import { Tooltip } from '@base-ui/react/tooltip';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

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
});
