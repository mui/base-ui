import { Slider } from '@base-ui/react/slider';
import { Field } from '@base-ui/react/field';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Slider.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Slider.Label />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Slider.Root defaultValue={50}>
          {node}
          <Slider.Control>
            <Slider.Thumb />
          </Slider.Control>
        </Slider.Root>,
      );
    },
  }));

  it('focuses the registered thumb when composed within a Field', async () => {
    const { user } = await render(
      <Field.Root>
        <Slider.Root defaultValue={50}>
          <Slider.Label data-testid="label">Volume</Slider.Label>
          <Slider.Control>
            <input aria-label="Unrelated range" type="range" />
            <Slider.Thumb />
          </Slider.Control>
        </Slider.Root>
      </Field.Root>,
    );

    await user.click(screen.getByTestId('label'));

    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveFocus();
    expect(screen.getByRole('slider', { name: 'Unrelated range' })).not.toHaveFocus();
  });

  it('does nothing when a Field slider has no thumb to focus', async () => {
    const { user } = await render(
      <Field.Root>
        <Slider.Root defaultValue={50}>
          <Slider.Label data-testid="label">Volume</Slider.Label>
          <Slider.Control />
        </Slider.Root>
      </Field.Root>,
    );

    await user.click(screen.getByTestId('label'));

    expect(document.body).toHaveFocus();
  });
});
