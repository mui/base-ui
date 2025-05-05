import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { CheckboxGroup } from '@base-ui-components/react/checkbox-group';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Checkbox.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Checkbox.Root />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render,
  }));

  describe('ARIA attributes', () => {
    it('sets the correct aria attributes', async () => {
      const { getByRole, getByTestId, setProps } = await render(
        <Checkbox.Root data-testid="test" required={false} />,
      );

      expect(getByRole('checkbox')).to.equal(getByTestId('test'));
      expect(getByRole('checkbox')).to.have.attribute('aria-checked');
      await setProps({ required: true });
      expect(getByRole('checkbox')).to.have.attribute('aria-required', 'true');
    });
  });

  describe('extra props', () => {
    it('can override the built-in attributes', async () => {
      const { container } = await render(<Checkbox.Root role="switch" />);
      expect(container.firstElementChild as HTMLElement).to.have.attribute('role', 'switch');
    });
  });

  it('should change its state when clicked', async () => {
    const { getAllByRole, container } = await render(<Checkbox.Root />);
    const [checkbox] = getAllByRole('checkbox');
    const input = container.querySelector('input[type=checkbox]') as HTMLInputElement;

    expect(checkbox).to.have.attribute('aria-checked', 'false');
    expect(input.checked).to.equal(false);

    await act(async () => {
      checkbox.click();
    });

    expect(checkbox).to.have.attribute('aria-checked', 'true');
    expect(input.checked).to.equal(true);

    await act(async () => {
      checkbox.click();
    });

    expect(checkbox).to.have.attribute('aria-checked', 'false');
    expect(input.checked).to.equal(false);
  });

  it('should update its state when changed from outside', async () => {
    function Test() {
      const [checked, setChecked] = React.useState(false);
      return (
        <div>
          <button onClick={() => setChecked((c) => !c)}>Toggle</button>
          <Checkbox.Root checked={checked} />;
        </div>
      );
    }

    const { getAllByRole, getByText } = await render(<Test />);
    const [checkbox] = getAllByRole('checkbox');
    const button = getByText('Toggle');

    expect(checkbox).to.have.attribute('aria-checked', 'false');
    await act(async () => {
      button.click();
    });

    expect(checkbox).to.have.attribute('aria-checked', 'true');

    await act(async () => {
      button.click();
    });

    expect(checkbox).to.have.attribute('aria-checked', 'false');
  });

  it('should call onChange when clicked', async () => {
    const handleChange = spy();
    const { getAllByRole } = await render(<Checkbox.Root onCheckedChange={handleChange} />);
    const [checkbox] = getAllByRole('checkbox');

    await act(async () => {
      checkbox.click();
    });

    expect(handleChange.callCount).to.equal(1);
    expect(handleChange.firstCall.args[0]).to.equal(true);
  });

  describe('prop: disabled', () => {
    it('should have the `disabled` attribute', async () => {
      const { getAllByRole } = await render(<Checkbox.Root disabled />);
      expect(getAllByRole('checkbox')[0]).to.have.attribute('disabled');
    });

    it('should not have the `disabled` attribute when `disabled` is not set', async () => {
      const { getAllByRole } = await render(<Checkbox.Root />);
      expect(getAllByRole('checkbox')[0]).not.to.have.attribute('disabled');
    });

    it('should not change its state when clicked', async () => {
      const { getAllByRole } = await render(<Checkbox.Root disabled />);
      const [checkbox] = getAllByRole('checkbox');

      expect(checkbox).to.have.attribute('aria-checked', 'false');

      await act(async () => {
        checkbox.click();
      });

      expect(checkbox).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: readOnly', () => {
    it('should have the `aria-readonly` attribute', async () => {
      const { getAllByRole } = await render(<Checkbox.Root readOnly />);
      expect(getAllByRole('checkbox')[0]).to.have.attribute('aria-readonly', 'true');
    });

    it('should not have the aria attribute when `readOnly` is not set', async () => {
      const { getAllByRole } = await render(<Checkbox.Root />);
      expect(getAllByRole('checkbox')[0]).not.to.have.attribute('aria-readonly');
    });

    it('should not change its state when clicked', async () => {
      const { getAllByRole } = await render(<Checkbox.Root readOnly />);
      const [checkbox] = getAllByRole('checkbox');

      expect(checkbox).to.have.attribute('aria-checked', 'false');

      await act(async () => {
        checkbox.click();
      });

      expect(checkbox).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: indeterminate', () => {
    it('should set the `aria-checked` attribute as "mixed"', async () => {
      const { getAllByRole } = await render(<Checkbox.Root indeterminate />);
      expect(getAllByRole('checkbox')[0]).to.have.attribute('aria-checked', 'mixed');
    });

    it('should not change its state when clicked', async () => {
      const { getAllByRole } = await render(<Checkbox.Root indeterminate />);
      const [checkbox] = getAllByRole('checkbox');

      expect(checkbox).to.have.attribute('aria-checked', 'mixed');

      await act(async () => {
        checkbox.click();
      });

      expect(checkbox).to.have.attribute('aria-checked', 'mixed');
    });

    it('should not have the aria attribute when `indeterminate` is not set', async () => {
      const { getAllByRole } = await render(<Checkbox.Root />);
      expect(getAllByRole('checkbox')[0]).not.to.have.attribute('aria-checked', 'mixed');
    });

    it('should not be overridden by `checked` prop', async () => {
      const { getAllByRole } = await render(<Checkbox.Root indeterminate checked />);
      expect(getAllByRole('checkbox')[0]).to.have.attribute('aria-checked', 'mixed');
    });
  });

  it('should update its state if the underlying input is toggled', async () => {
    const { getAllByRole, container } = await render(<Checkbox.Root />);
    const [checkbox] = getAllByRole('checkbox');
    const input = container.querySelector('input[type=checkbox]') as HTMLInputElement;

    await act(async () => {
      input.click();
    });

    expect(checkbox).to.have.attribute('aria-checked', 'true');
  });

  it('should place the style hooks on the root and the indicator', async () => {
    const { getAllByRole, setProps } = await render(
      <Checkbox.Root defaultChecked disabled readOnly required>
        <Checkbox.Indicator />
      </Checkbox.Root>,
    );

    const [checkbox] = getAllByRole('checkbox');
    const indicator = checkbox.querySelector('span');

    expect(checkbox).to.have.attribute('data-checked', '');
    expect(checkbox).not.to.have.attribute('data-unchecked');

    expect(checkbox).to.have.attribute('data-disabled', '');
    expect(checkbox).to.have.attribute('data-readonly', '');
    expect(checkbox).to.have.attribute('data-required', '');

    expect(indicator).to.have.attribute('data-checked', '');
    expect(indicator).not.to.have.attribute('data-unchecked');

    expect(indicator).to.have.attribute('data-disabled', '');
    expect(indicator).to.have.attribute('data-readonly', '');
    expect(indicator).to.have.attribute('data-required', '');

    await setProps({ disabled: false, readOnly: false });
    fireEvent.click(checkbox);

    expect(checkbox).to.have.attribute('data-unchecked', '');
    expect(checkbox).not.to.have.attribute('data-checked');
  });

  it('should set the name attribute on the input', async () => {
    const { container } = await render(<Checkbox.Root name="checkbox-name" />);
    const input = container.querySelector('input[type="checkbox"]')! as HTMLInputElement;

    expect(input).to.have.attribute('name', 'checkbox-name');
  });

  describe('Form', () => {
    it('should toggle the checkbox when a parent label is clicked', async () => {
      const { getByTestId, getAllByRole } = await render(
        <label data-testid="label">
          <Checkbox.Root />
          Toggle
        </label>,
      );

      const [checkbox] = getAllByRole('checkbox');
      const label = getByTestId('label');

      expect(checkbox).to.have.attribute('aria-checked', 'false');

      await act(async () => {
        label.click();
      });

      expect(checkbox).to.have.attribute('aria-checked', 'true');
    });

    it('should toggle the checkbox when a linked label is clicked', async () => {
      const { getByTestId, getAllByRole } = await render(
        <div>
          <label htmlFor="test-checkbox" data-testid="label">
            Toggle
          </label>
          <Checkbox.Root id="test-checkbox" />
        </div>,
      );

      const [checkbox] = getAllByRole('checkbox');
      const label = getByTestId('label');

      expect(checkbox).to.have.attribute('aria-checked', 'false');

      await act(async () => {
        label.click();
      });

      expect(checkbox).to.have.attribute('aria-checked', 'true');
    });

    it('triggers native HTML validation on submit', async () => {
      const { user } = await render(
        <Form>
          <Field.Root name="test" data-testid="field">
            <Checkbox.Root required />
            <Field.Error match="valueMissing" data-testid="error">
              required
            </Field.Error>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      const submit = screen.getByText('Submit');

      expect(screen.queryByTestId('error')).to.equal(null);

      await user.click(submit);

      const error = screen.getByTestId('error');
      expect(error).to.have.text('required');
    });

    it('clears errors on change', async () => {
      function App() {
        const [errors, setErrors] = React.useState<Record<string, string | string[]>>({
          test: 'test',
        });
        return (
          <Form errors={errors} onClearErrors={setErrors}>
            <Field.Root name="test" data-testid="field">
              <Checkbox.Root data-testid="checkbox" />
              <Field.Error data-testid="error" />
            </Field.Root>
          </Form>
        );
      }

      await render(<App />);

      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).to.have.attribute('aria-invalid', 'true');
      expect(screen.queryByTestId('error')).to.have.text('test');

      fireEvent.click(checkbox);

      expect(checkbox).not.to.have.attribute('aria-invalid');
      expect(screen.queryByTestId('error')).to.equal(null);
    });

    it('should include the checkbox value in the form submission', async ({ skip }) => {
      if (isJSDOM) {
        // FormData is not available in JSDOM
        skip();
      }

      let stringifiedFormData = '';

      const { getAllByRole, getByRole } = await render(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            stringifiedFormData = new URLSearchParams(formData as any).toString();
          }}
        >
          <Checkbox.Root name="test-checkbox" />
          <button type="submit">Submit</button>
        </form>,
      );

      const [checkbox] = getAllByRole('checkbox');
      const submitButton = getByRole('button')!;

      submitButton.click();

      expect(stringifiedFormData).to.equal('test-checkbox=off');

      await act(async () => {
        checkbox.click();
      });

      submitButton.click();

      expect(stringifiedFormData).to.equal('test-checkbox=on');
    });

    it('should include the custom checkbox value in the form submission', async ({ skip }) => {
      if (isJSDOM) {
        // FormData is not available in JSDOM
        skip();
      }

      let stringifiedFormData = '';

      const { getAllByRole, getByRole } = await render(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            stringifiedFormData = new URLSearchParams(formData as any).toString();
          }}
        >
          <Checkbox.Root name="test-checkbox" value="test-value" />
          <button type="submit">Submit</button>
        </form>,
      );

      const [checkbox] = getAllByRole('checkbox');
      const submitButton = getByRole('button')!;

      submitButton.click();

      expect(stringifiedFormData).to.equal('test-checkbox=off');

      await act(async () => {
        checkbox.click();
      });

      submitButton.click();

      expect(stringifiedFormData).to.equal('test-checkbox=test-value');
    });
  });

  describe('Field', () => {
    it('should receive disabled prop from Field.Root', async () => {
      const { getAllByRole } = await render(
        <Field.Root disabled>
          <Checkbox.Root />
        </Field.Root>,
      );

      const [checkbox] = getAllByRole('checkbox');
      expect(checkbox).to.have.attribute('disabled');
    });

    it('should receive name prop from Field.Root', async () => {
      const { container } = await render(
        <Field.Root name="field-checkbox">
          <Checkbox.Root />
        </Field.Root>,
      );

      const input = container.querySelector('input[type="checkbox"]');
      expect(input).to.have.attribute('name', 'field-checkbox');
    });

    it('[data-touched]', async () => {
      await render(
        <Field.Root>
          <Checkbox.Root data-testid="button" />
        </Field.Root>,
      );

      const button = screen.getByTestId('button');

      fireEvent.focus(button);
      fireEvent.blur(button);

      expect(button).to.have.attribute('data-touched', '');
    });

    it('[data-dirty]', async () => {
      await render(
        <Field.Root>
          <Checkbox.Root data-testid="button" />
        </Field.Root>,
      );

      const button = screen.getByTestId('button');

      expect(button).not.to.have.attribute('data-dirty');

      fireEvent.click(button);

      expect(button).to.have.attribute('data-dirty', '');
    });

    describe('[data-filled]', () => {
      it('adds [data-filled] attribute when checked after being initially unchecked', async () => {
        await render(
          <Field.Root>
            <Checkbox.Root data-testid="button" />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        expect(button).not.to.have.attribute('data-filled');

        fireEvent.click(button);

        expect(button).to.have.attribute('data-filled', '');

        fireEvent.click(button);

        expect(button).not.to.have.attribute('data-filled');
      });

      it('removes [data-filled] attribute when unchecked after being initially checked', async () => {
        await render(
          <Field.Root>
            <Checkbox.Root data-testid="button" defaultChecked />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        expect(button).to.have.attribute('data-filled');

        fireEvent.click(button);

        expect(button).not.to.have.attribute('data-filled', '');
      });

      it('adds [data-filled] attribute when any checkbox is filled when inside a group', async () => {
        await render(
          <Field.Root>
            <CheckboxGroup defaultValue={['1', '2']}>
              <Checkbox.Root name="1" data-testid="button-1" />
              <Checkbox.Root name="2" data-testid="button-2" />
            </CheckboxGroup>
          </Field.Root>,
        );

        const button1 = screen.getByTestId('button-1');
        const button2 = screen.getByTestId('button-2');

        expect(button1).to.have.attribute('data-filled');
        expect(button2).to.have.attribute('data-filled');

        fireEvent.click(button1);

        expect(button1).to.have.attribute('data-filled');
        expect(button2).to.have.attribute('data-filled');

        fireEvent.click(button2);

        expect(button1).not.to.have.attribute('data-filled');
        expect(button2).not.to.have.attribute('data-filled');
      });
    });

    it('[data-focused]', async () => {
      await render(
        <Field.Root>
          <Checkbox.Root data-testid="button" />
        </Field.Root>,
      );

      const button = screen.getByTestId('button');

      expect(button).not.to.have.attribute('data-focused');

      fireEvent.focus(button);

      expect(button).to.have.attribute('data-focused', '');

      fireEvent.blur(button);

      expect(button).not.to.have.attribute('data-focused');
    });

    it('prop: validate', async () => {
      await render(
        <Field.Root validate={() => 'error'}>
          <Checkbox.Root data-testid="button" />
          <Field.Error data-testid="error" />
        </Field.Root>,
      );

      const button = screen.getByTestId('button');

      expect(button).not.to.have.attribute('aria-invalid');

      fireEvent.focus(button);
      fireEvent.blur(button);

      expect(button).to.have.attribute('aria-invalid', 'true');
    });

    it('props: validationMode=onChange', async () => {
      await render(
        <Field.Root
          validationMode="onChange"
          validate={(value) => {
            const checked = value as boolean;
            return checked ? 'error' : null;
          }}
        >
          <Checkbox.Root data-testid="button" />
        </Field.Root>,
      );

      const button = screen.getByTestId('button');

      expect(button).not.to.have.attribute('aria-invalid');

      fireEvent.click(button);

      expect(button).to.have.attribute('aria-invalid', 'true');
    });

    it('prop: validationMode=onBlur', async () => {
      await render(
        <Field.Root
          validationMode="onBlur"
          validate={(value) => {
            const checked = value as boolean;
            return checked ? 'error' : null;
          }}
        >
          <Checkbox.Root data-testid="button" />
          <Field.Error data-testid="error" />
        </Field.Root>,
      );

      const button = screen.getByTestId('button');

      expect(button).not.to.have.attribute('aria-invalid');

      fireEvent.click(button);
      fireEvent.blur(button);

      expect(button).to.have.attribute('aria-invalid', 'true');
    });

    it('Field.Label', async () => {
      const { container } = await render(
        <Field.Root>
          <Checkbox.Root data-testid="button" />
          <Field.Description data-testid="description" />
        </Field.Root>,
      );

      const internalInput = container.querySelector<HTMLInputElement>('input[type="checkbox"]');

      expect(internalInput).to.have.attribute(
        'aria-describedby',
        screen.getByTestId('description').id,
      );
    });

    it('Field.Description', async () => {
      const { container } = await render(
        <Field.Root>
          <Checkbox.Root data-testid="button" />
          <Field.Description data-testid="description" />
        </Field.Root>,
      );

      const internalInput = container.querySelector<HTMLInputElement>('input[type="checkbox"]');

      expect(internalInput).to.have.attribute(
        'aria-describedby',
        screen.getByTestId('description').id,
      );
    });
  });

  it('should change state when clicking the checkbox if it has a wrapping label', async () => {
    const { getAllByRole } = await render(
      <label data-testid="label">
        <Checkbox.Root />
        Toggle
      </label>,
    );

    const [checkbox] = getAllByRole('checkbox');

    expect(checkbox).to.have.attribute('aria-checked', 'false');

    fireEvent.click(checkbox);

    expect(checkbox).to.have.attribute('aria-checked', 'true');

    fireEvent.click(checkbox);

    expect(checkbox).to.have.attribute('aria-checked', 'false');
  });
});
