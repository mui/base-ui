import { Field } from '@base-ui/react/field';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Field.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Label />, () => ({
    refInstanceof: window.HTMLLabelElement,
    render(node) {
      return render(<Field.Root>{node}</Field.Root>);
    },
  }));

  it('should set htmlFor referencing the control automatically', async () => {
    await render(
      <Field.Root data-testid="field">
        <Field.Control />
        <Field.Label data-testid="label">Label</Field.Label>
      </Field.Root>,
    );

    expect(screen.getByTestId('label')).to.have.attribute('for', screen.getByRole('textbox').id);
  });

  it('when nativeLabel={false}, clicking focuses the associated control', async () => {
    const { user } = await render(
      <Field.Root>
        <Field.Control data-testid="control" />
        <Field.Label nativeLabel={false} render={<div />} data-testid="label">
          Label
        </Field.Label>
      </Field.Root>,
    );

    const label = screen.getByTestId('label');
    const control = screen.getByTestId('control');

    expect(label).to.not.have.attribute('for');

    await user.click(label);
    expect(control).toHaveFocus();
  });
});
