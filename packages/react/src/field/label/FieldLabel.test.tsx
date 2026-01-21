import { Field } from '@base-ui/react/field';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'vitest';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Field.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Label />, () => ({
    refInstanceof: window.HTMLLabelElement,
    testRenderPropWith: 'label',
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

  describe('dev warnings', () => {
    it('does not warn by default', async () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockName('console.error')
        .mockImplementation(() => {});

      await render(
        <Field.Root>
          <Field.Control />
          <Field.Label>Label</Field.Label>
        </Field.Root>,
      );

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('errors if nativeLabel=true but ref is not a label', async () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockName('console.error')
        .mockImplementation(() => {});

      await render(
        <Field.Root>
          <Field.Control />
          <Field.Label nativeLabel render={<div />}>
            Label
          </Field.Label>
        </Field.Root>,
      );

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        'Base UI: <Field.Label> was not rendered as a <label> element, which does not match the `nativeLabel` prop on the component. Ensure that the element passed to the `render` prop of <Field.Label> is a real <label>, or set the `nativeLabel` prop on the component to `false`.',
      );
      errorSpy.mockRestore();
    });

    it('errors if nativeLabel=false but ref is a label', async () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockName('console.error')
        .mockImplementation(() => {});

      await render(
        <Field.Root>
          <Field.Control />
          <Field.Label nativeLabel={false}>Label</Field.Label>
        </Field.Root>,
      );

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        'Base UI: <Field.Label> was rendered as a <label> element, which does not match the `nativeLabel` prop on the component. Ensure that the element passed to the `render` prop of <Field.Label> is not a real <label>, or set the `nativeLabel` prop on the component to `true`.',
      );
      errorSpy.mockRestore();
    });
  });
});
