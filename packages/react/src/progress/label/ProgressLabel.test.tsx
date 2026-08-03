import * as React from 'react';
import { expect, vi } from 'vitest';
import { Progress } from '@base-ui/react/progress';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Progress.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Progress.Label />, () => ({
    render: (node) => {
      return render(<Progress.Root value={40}>{node}</Progress.Root>);
    },
    refInstanceof: window.HTMLSpanElement,
  }));

  it('updates and clears the progress bar label association', async () => {
    function App() {
      const [labelId, setLabelId] = React.useState('label-a');
      const [showLabel, setShowLabel] = React.useState(true);

      return (
        <React.Fragment>
          <Progress.Root value={40}>
            {showLabel ? <Progress.Label id={labelId}>Upload progress</Progress.Label> : null}
          </Progress.Root>
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

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-labelledby', 'label-a');

    fireEvent.click(screen.getByRole('button', { name: 'Change id' }));
    expect(progressbar).toHaveAttribute('aria-labelledby', 'label-b');

    fireEvent.click(screen.getByRole('button', { name: 'Remove label' }));
    expect(progressbar).not.toHaveAttribute('aria-labelledby');
  });

  it('throws a descriptive error when rendered outside <Progress.Root>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Progress.Label />)).rejects.toThrow(
        'Base UI: ProgressRootContext is missing. Progress parts must be placed within <Progress.Root>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
