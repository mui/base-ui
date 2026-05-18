import { expect } from 'vitest';
import { Progress } from '@base-ui/react/progress';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Progress.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Progress.Label />, () => ({
    render: (node) => {
      return render(<Progress.Root value={40}>{node}</Progress.Root>);
    },
    refInstanceof: window.HTMLSpanElement,
  }));

  it('has progress state attributes', async () => {
    const { setProps } = await render(
      <Progress.Root value={40}>
        <Progress.Label data-testid="label" />
      </Progress.Root>,
    );

    const label = screen.getByTestId('label');
    expect(label).toHaveAttribute('data-progressing', '');

    await setProps({ value: 100 });
    expect(label).toHaveAttribute('data-complete', '');

    await setProps({ value: null });
    expect(label).toHaveAttribute('data-indeterminate', '');
  });
});
