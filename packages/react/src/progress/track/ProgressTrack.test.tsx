import { expect } from 'vitest';
import { Progress } from '@base-ui/react/progress';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Progress.Track />', () => {
  const { render } = createRenderer();

  describeConformance(<Progress.Track />, () => ({
    render: (node) => {
      return render(<Progress.Root value={40}>{node}</Progress.Root>);
    },
    refInstanceof: window.HTMLDivElement,
  }));

  it('has progress state attributes', async () => {
    const { setProps } = await render(
      <Progress.Root value={40}>
        <Progress.Track data-testid="track" />
      </Progress.Root>,
    );

    const track = screen.getByTestId('track');
    expect(track).toHaveAttribute('data-progressing', '');

    await setProps({ value: 100 });
    expect(track).toHaveAttribute('data-complete', '');

    await setProps({ value: null });
    expect(track).toHaveAttribute('data-indeterminate', '');
  });
});
