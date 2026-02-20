import { Checkbox } from '@base-ui/react/checkbox';
import { Field } from '@base-ui/react/field';
import { Label } from '@base-ui/react/label';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'vitest';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Label />', () => {
  const { render, renderToString } = createRenderer();

  describeConformance(<Label />, () => ({
    render,
    refInstanceof: window.HTMLLabelElement,
    testRenderPropWith: 'label',
  }));

  it('sets `aria-labelledby` on the associated control automatically', async () => {
    await render(
      <Field.Root>
        <Field.Control data-testid="control" />
        <Label data-testid="label">Label</Label>
      </Field.Root>,
    );

    const label = screen.getByTestId('label');
    const control = screen.getByTestId('control');

    expect(label.id).not.to.equal('');
    expect(control).to.have.attribute('aria-labelledby', label.id);
  });

  it('sets id on the label and `aria-labelledby` on a wrapped control', async () => {
    await render(
      <Label data-testid="label">
        <Checkbox.Root data-testid="control" />
        Label
      </Label>,
    );

    const label = screen.getByTestId('label');
    const control = screen.getByTestId('control');

    expect(label.id).not.to.equal('');
    expect(control).to.have.attribute('aria-labelledby', label.id);
  });

  it.skipIf(isJSDOM)('sets `aria-labelledby` on a wrapped control during SSR', async () => {
    await renderToString(
      <Label data-testid="label">
        <Checkbox.Root data-testid="control" />
        Label
      </Label>,
    );

    const label = screen.getByTestId('label');
    const control = screen.getByTestId('control');

    expect(label.id).not.to.equal('');
    expect(control).to.have.attribute('aria-labelledby', label.id);
  });

  it('sets htmlFor and id from the associated control id and the explicit id prop', async () => {
    await render(
      <Field.Root>
        <Field.Control id="control" />
        <Label data-testid="label" id="label-id">
          Label
        </Label>
      </Field.Root>,
    );

    const label = screen.getByTestId('label');

    expect(label).to.have.attribute('id', 'label-id');
    expect(label).to.have.attribute('for', 'control');
  });

  it('when nativeLabel={false}, clicking focuses the associated control', async () => {
    const { user } = await render(
      <Field.Root>
        <Field.Control data-testid="control" />
        <Label nativeLabel={false} render={<div />} data-testid="label">
          Label
        </Label>
      </Field.Root>,
    );

    const label = screen.getByTestId('label');
    const control = screen.getByTestId('control');

    expect(label).to.not.have.attribute('for');

    await user.click(label);
    expect(control).toHaveFocus();
  });

  it('when nativeLabel={false}, does not prevent interactions on interactive descendants', async () => {
    const handleClick = vi.fn();

    const { user } = await render(
      <Label nativeLabel={false} render={<div />}>
        <button data-testid="button" type="button" onClick={handleClick}>
          Open
        </button>
      </Label>,
    );

    await user.click(screen.getByTestId('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  describe('dev warnings', () => {
    it('does not warn by default', async () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockName('console.error')
        .mockImplementation(() => {});

      await render(<Label>Label</Label>);

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('errors if nativeLabel=true but ref is not a label', async () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockName('console.error')
        .mockImplementation(() => {});

      await render(
        <Label nativeLabel render={<div />}>
          Label
        </Label>,
      );

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Base UI: Expected a <label> element because the `nativeLabel` prop is true. ' +
            'Rendering a non-<label> disables native label association, so `htmlFor` will not ' +
            'work. Use a real <label> in the `render` prop, or set `nativeLabel` to `false`.',
        ),
      );
      errorSpy.mockRestore();
    });

    it('errors if nativeLabel=false but ref is a label', async () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockName('console.error')
        .mockImplementation(() => {});

      await render(<Label nativeLabel={false}>Label</Label>);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Base UI: Expected a non-<label> element because the `nativeLabel` prop is false. ' +
            'Rendering a <label> assumes native label behavior while Base UI treats it as ' +
            'non-native, which can cause unexpected pointer behavior. Use a non-<label> in the ' +
            '`render` prop, or set `nativeLabel` to `true`.',
        ),
      );
      errorSpy.mockRestore();
    });
  });
});
