import * as React from 'react';
import { expect, vi } from 'vitest';
import { Meter } from '@base-ui/react/meter';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Meter.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Meter.Label />, () => ({
    render: (node) => {
      return render(<Meter.Root value={50}>{node}</Meter.Root>);
    },
    refInstanceof: window.HTMLSpanElement,
  }));

  it('updates and clears the meter label association', async () => {
    function App() {
      const [labelId, setLabelId] = React.useState('label-a');
      const [showLabel, setShowLabel] = React.useState(true);

      return (
        <React.Fragment>
          <Meter.Root value={50}>
            {showLabel ? <Meter.Label id={labelId}>Battery level</Meter.Label> : null}
          </Meter.Root>
          <button type="button" onClick={() => setLabelId('label-b')}>
            Change id
          </button>
          <button type="button" onClick={() => setShowLabel(false)}>
            Remove label
          </button>
        </React.Fragment>
      );
    }

    await render(<App />);

    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-labelledby', 'label-a');

    fireEvent.click(screen.getByRole('button', { name: 'Change id' }));
    expect(meter).toHaveAttribute('aria-labelledby', 'label-b');

    fireEvent.click(screen.getByRole('button', { name: 'Remove label' }));
    expect(meter).not.toHaveAttribute('aria-labelledby');
  });

  it('throws a descriptive error when rendered outside <Meter.Root>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Meter.Label />)).rejects.toThrow(
        'Base UI: MeterRootContext is missing. Meter parts must be placed within <Meter.Root>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
