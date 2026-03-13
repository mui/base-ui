import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Checkbox.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Checkbox.Root />, () => ({
    refInstanceof: window.HTMLSpanElement,
    testComponentPropWith: 'span',
    button: true,
    render,
  }));

  describe('ARIA attributes', () => {
    it('sets the correct aria attributes', async () => {
      const { setProps } = await render(<Checkbox.Root data-testid="test" required={false} />);

      expect(screen.getByRole('checkbox')).to.equal(screen.getByTestId('test'));
      expect(screen.getByRole('checkbox')).to.have.attribute('aria-checked');
      await setProps({ required: true });
      expect(screen.getByRole('checkbox')).to.have.attribute('aria-required', 'true');
    });
  });

  describe('extra props', () => {
    it('can override the built-in attributes', async () => {
      const { container } = await render(<Checkbox.Root role="switch" />);
      expect(container.firstElementChild as HTMLElement).to.have.attribute('role', 'switch');
    });
  });

  describe('interactions', () => {
    it('should change its state when clicked', async () => {
      await render(<Checkbox.Root />);
      const [checkbox] = screen.getAllByRole('checkbox');
      // querying it separately since hidden true returns both button and input.
      // without hidden it only returns the button (in the above query)
      const [, input] = screen.getAllByRole<HTMLInputElement>('checkbox', {
        hidden: true,
      });

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

      await render(<Test />);
      const [checkbox] = screen.getAllByRole('checkbox');
      const button = screen.getByText('Toggle');

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

    it('should call onCheckedChange when clicked', async () => {
      const handleChange = spy();
      await render(<Checkbox.Root onCheckedChange={handleChange} />);
      const [checkbox] = screen.getAllByRole('checkbox');

      await act(async () => {
        checkbox.click();
      });

      expect(handleChange.callCount).to.equal(1);
      expect(handleChange.firstCall.args[0]).to.equal(true);
    });

    it('should report keyboard modifier event properties when calling onCheckedChange', async () => {
      const handleChange = spy((checked, eventDetails) => eventDetails);
      const { user } = await render(<Checkbox.Root onCheckedChange={handleChange} />);
      const [checkbox] = screen.getAllByRole('checkbox');

      await user.keyboard('{Shift>}');
      await user.click(checkbox);
      await user.keyboard('{/Shift}');

      expect(handleChange.callCount).to.equal(1);
      expect(handleChange.firstCall.returnValue.event.shiftKey).to.equal(true);
    });

    it('should update its state if the underlying input is toggled', async () => {
      await render(<Checkbox.Root />);
      const checkbox = screen.getByRole('checkbox');
      const internalInput = document.querySelector<HTMLInputElement>('input[type="checkbox"]');

      await act(async () => {
        internalInput?.click();
      });

      expect(checkbox).to.have.attribute('aria-checked', 'true');
    });

    ['Enter', 'Space'].forEach((key) => {
      it(`can be activated with ${key} key`, async () => {
        const { user } = await render(<Checkbox.Root />);

        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).to.have.attribute('aria-checked', 'false');

        await user.keyboard('[Tab]');
        expect(checkbox).toHaveFocus();

        await user.keyboard(`[${key}]`);
        expect(checkbox).to.have.attribute('aria-checked', 'true');
      });
    });
  });

  describe('prop: disabled', () => {
    it('uses aria-disabled instead of HTML disabled', async () => {
      await render(<Checkbox.Root disabled />);
      expect(screen.getByRole('checkbox')).to.not.have.attribute('disabled');
      expect(screen.getByRole('checkbox')).to.have.attribute('aria-disabled', 'true');
    });

    it('should not change its state when clicked', async () => {
      await render(<Checkbox.Root disabled />);
      const [checkbox] = screen.getAllByRole('checkbox');

      expect(checkbox).to.have.attribute('aria-checked', 'false');

      await act(async () => {
        checkbox.click();
      });

      expect(checkbox).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: readOnly', () => {
    it('should have the `aria-readonly` attribute', async () => {
      await render(<Checkbox.Root readOnly />);
      expect(screen.getAllByRole('checkbox')[0]).to.have.attribute('aria-readonly', 'true');
    });

    it('should not have the aria attribute when `readOnly` is not set', async () => {
      await render(<Checkbox.Root />);
      expect(screen.getAllByRole('checkbox')[0]).not.to.have.attribute('aria-readonly');
    });

    it('should not change its state when clicked', async () => {
      await render(<Checkbox.Root readOnly />);
      const [checkbox] = screen.getAllByRole('checkbox');

      expect(checkbox).to.have.attribute('aria-checked', 'false');

      await act(async () => {
        checkbox.click();
      });

      expect(checkbox).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: indeterminate', () => {
    it('should set the `aria-checked` attribute as "mixed"', async () => {
      await render(<Checkbox.Root indeterminate />);
      expect(screen.getAllByRole('checkbox')[0]).to.have.attribute('aria-checked', 'mixed');
    });

    it('should not change its state when clicked', async () => {
      await render(<Checkbox.Root indeterminate />);
      const [checkbox] = screen.getAllByRole('checkbox');

      expect(checkbox).to.have.attribute('aria-checked', 'mixed');

      await act(async () => {
        checkbox.click();
      });

      expect(checkbox).to.have.attribute('aria-checked', 'mixed');
    });

    it('should not have the aria attribute when `indeterminate` is not set', async () => {
      await render(<Checkbox.Root />);
      expect(screen.getAllByRole('checkbox')[0]).not.to.have.attribute('aria-checked', 'mixed');
    });

    it('should not be overridden by `checked` prop', async () => {
      await render(<Checkbox.Root indeterminate checked />);
      expect(screen.getAllByRole('checkbox')[0]).to.have.attribute('aria-checked', 'mixed');
    });
  });

  it('should update its state if the underlying input is toggled', async () => {
    await render(<Checkbox.Root />);
    const [checkbox] = screen.getAllByRole('checkbox');
    const [, input] = screen.getAllByRole<HTMLInputElement>('checkbox', {
      hidden: true,
    });

    await act(async () => {
      input.click();
    });

    expect(checkbox).to.have.attribute('aria-checked', 'true');
  });

  it('should place the style hooks on the root and the indicator', async () => {
    const { setProps } = await render(
      <Checkbox.Root defaultChecked disabled readOnly required>
        <Checkbox.Indicator />
      </Checkbox.Root>,
    );

    const [checkbox] = screen.getAllByRole('checkbox');
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

  it('should set the name attribute only on the input', async () => {
    await render(<Checkbox.Root name="checkbox-name" />);

    const [, input] = screen.getAllByRole<HTMLInputElement>('checkbox', {
      hidden: true,
    });
    expect(input).to.have.attribute('name', 'checkbox-name');
    expect(screen.getByRole('checkbox')).not.to.have.attribute('name');
  });

  // flaky with user.click
  describe('with native <label>', () => {
    it('should toggle the checkbox when a wrapping <label> is clicked', async () => {
      await render(
        <label data-testid="label">
          <Checkbox.Root />
          Toggle
        </label>,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).to.have.attribute('aria-checked', 'false');

      fireEvent.click(screen.getByTestId('label'));
      expect(checkbox).to.have.attribute('aria-checked', 'true');
    });

    it('should toggle the checkbox when a explicitly linked <label> is clicked', async () => {
      await render(
        <div>
          <label data-testid="label" htmlFor="myCheckbox">
            Toggle
          </label>

          <Checkbox.Root id="myCheckbox" />
        </div>,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).to.have.attribute('aria-checked', 'false');

      fireEvent.click(screen.getByTestId('label'));
      expect(checkbox).to.have.attribute('aria-checked', 'true');
    });

    it('should associate `id` with the native button when `nativeButton=true`', async () => {
      await render(
        <div>
          <label data-testid="label" htmlFor="myCheckbox">
            Toggle
          </label>

          <Checkbox.Root id="myCheckbox" nativeButton render={<button />} />
        </div>,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).to.have.attribute('id', 'myCheckbox');

      const hiddenInputs = screen.getAllByRole<HTMLInputElement>('checkbox', { hidden: true });
      const hiddenInput = hiddenInputs.find((input) => input !== checkbox);
      expect(hiddenInput).not.to.equal(undefined);
      expect(hiddenInput).not.to.have.attribute('id', 'myCheckbox');

      expect(checkbox).to.have.attribute('aria-checked', 'false');
      fireEvent.click(screen.getByTestId('label'));
      expect(checkbox).to.have.attribute('aria-checked', 'true');
    });
  });

  describe('Form', () => {
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

    it('clears external errors on change', async () => {
      await render(
        <Form
          errors={{
            test: 'test',
          }}
        >
          <Field.Root name="test" data-testid="field">
            <Checkbox.Root data-testid="checkbox" />
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>,
      );

      const checkbox = screen.getByTestId('checkbox');

      expect(checkbox).to.have.attribute('aria-invalid', 'true');
      expect(screen.queryByTestId('error')).to.have.text('test');

      fireEvent.click(checkbox);

      expect(checkbox).not.to.have.attribute('aria-invalid');
      expect(screen.queryByTestId('error')).to.equal(null);
    });

    it.skipIf(isJSDOM)(
      'should include the checkbox value in form submission, matching native checkbox behavior',
      async () => {
        const submitSpy = spy((event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          return formData.get('test-checkbox');
        });

        await render(
          <Form onSubmit={submitSpy}>
            <Field.Root name="test-checkbox">
              <Checkbox.Root />
            </Field.Root>
            <button type="submit">Submit</button>
          </Form>,
        );

        const checkbox = screen.getByRole('checkbox');
        const submitButton = screen.getByRole('button')!;

        await act(async () => {
          submitButton.click();
        });

        expect(submitSpy.callCount).to.equal(1);
        expect(submitSpy.lastCall.returnValue).to.equal(null);

        await act(async () => {
          checkbox.click();
        });

        await act(async () => {
          submitButton.click();
        });

        expect(submitSpy.callCount).to.equal(2);
        expect(submitSpy.lastCall.returnValue).to.equal('on');
      },
    );

    it.skipIf(isJSDOM)(
      'should include the custom checkbox value in form submission, matching native checkbox behavior',
      async () => {
        const submitSpy = spy((event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          return formData.get('test-checkbox');
        });

        await render(
          <Form onSubmit={submitSpy}>
            <Field.Root name="test-checkbox">
              <Checkbox.Root value="test-value" />
            </Field.Root>
            <button type="submit">Submit</button>
          </Form>,
        );

        const checkbox = screen.getByRole('checkbox');
        const submitButton = screen.getByRole('button')!;

        await act(async () => {
          submitButton.click();
        });

        expect(submitSpy.callCount).to.equal(1);
        expect(submitSpy.lastCall.returnValue).to.equal(null);

        await act(async () => {
          checkbox.click();
        });

        await act(async () => {
          submitButton.click();
        });

        expect(submitSpy.callCount).to.equal(2);
        expect(submitSpy.lastCall.returnValue).to.equal('test-value');
      },
    );

    it.skipIf(isJSDOM)('matches native checkbox form submission behavior', async () => {
      const nativeSubmitSpy = spy((event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        return {
          get: formData.get('native'),
          getAll: formData.getAll('native'),
        };
      });

      const customSubmitSpy = spy((event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        return {
          get: formData.get('custom'),
          getAll: formData.getAll('custom'),
        };
      });

      const { user: nativeUser } = await render(
        <form onSubmit={nativeSubmitSpy}>
          <input type="checkbox" name="native" />
          <button type="submit">Submit</button>
        </form>,
      );

      const nativeCheckbox = screen.getByRole('checkbox');
      const nativeSubmitButton = screen.getByRole('button')!;

      await nativeUser.click(nativeSubmitButton);
      expect(nativeSubmitSpy.lastCall.returnValue.get).to.equal(null);
      expect(nativeSubmitSpy.lastCall.returnValue.getAll).to.deep.equal([]);

      await nativeUser.click(nativeCheckbox);
      await nativeUser.click(nativeSubmitButton);
      expect(nativeSubmitSpy.lastCall.returnValue.get).to.equal('on');

      const { user: customUser } = await render(
        <Form onSubmit={customSubmitSpy}>
          <Field.Root name="custom">
            <Checkbox.Root />
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      const customCheckbox = screen.getAllByRole('checkbox')[1];
      const customSubmitButton = screen.getAllByRole('button')[1]!;

      await customUser.click(customSubmitButton);
      expect(customSubmitSpy.lastCall.returnValue.get).to.equal(null);
      expect(customSubmitSpy.lastCall.returnValue.getAll).to.deep.equal([]);

      await customUser.click(customCheckbox);
      await customUser.click(customSubmitButton);
      expect(customSubmitSpy.lastCall.returnValue.get).to.equal('on');
    });

    it.skipIf(isJSDOM)(
      'should submit uncheckedValue when checkbox is unchecked and uncheckedValue is specified',
      async () => {
        const submitSpy = spy((event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          return formData.get('test-checkbox');
        });

        await render(
          <Form onSubmit={submitSpy}>
            <Field.Root name="test-checkbox">
              <Checkbox.Root uncheckedValue="off" />
            </Field.Root>
            <button type="submit">Submit</button>
          </Form>,
        );

        const checkbox = screen.getByRole('checkbox');
        const submitButton = screen.getByRole('button')!;

        await act(async () => {
          submitButton.click();
        });

        expect(submitSpy.callCount).to.equal(1);
        expect(submitSpy.lastCall.returnValue).to.equal('off');

        await act(async () => {
          checkbox.click();
        });

        await act(async () => {
          submitButton.click();
        });

        expect(submitSpy.callCount).to.equal(2);
        expect(submitSpy.lastCall.returnValue).to.equal('on');

        await act(async () => {
          checkbox.click();
        });

        await act(async () => {
          submitButton.click();
        });

        expect(submitSpy.callCount).to.equal(3);
        expect(submitSpy.lastCall.returnValue).to.equal('off');
      },
    );

    it.skipIf(isJSDOM)(
      'should submit custom uncheckedValue when checkbox is unchecked',
      async () => {
        const submitSpy = spy((event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          return formData.get('test-checkbox');
        });

        await render(
          <Form onSubmit={submitSpy}>
            <Field.Root name="test-checkbox">
              <Checkbox.Root uncheckedValue="false" value="true" />
            </Field.Root>
            <button type="submit">Submit</button>
          </Form>,
        );

        const checkbox = screen.getByRole('checkbox');
        const submitButton = screen.getByRole('button')!;

        await act(async () => {
          submitButton.click();
        });

        expect(submitSpy.callCount).to.equal(1);
        expect(submitSpy.lastCall.returnValue).to.equal('false');

        await act(async () => {
          checkbox.click();
        });

        await act(async () => {
          submitButton.click();
        });

        expect(submitSpy.callCount).to.equal(2);
        expect(submitSpy.lastCall.returnValue).to.equal('true');
      },
    );
  });

  describe('Field', () => {
    it('should receive disabled prop from Field.Root', async () => {
      await render(
        <Field.Root disabled>
          <Checkbox.Root />
        </Field.Root>,
      );

      const [checkbox] = screen.getAllByRole('checkbox');
      expect(checkbox).to.have.attribute('aria-disabled', 'true');
    });

    it('should receive name prop from Field.Root', async () => {
      await render(
        <Field.Root name="field-checkbox">
          <Checkbox.Root />
        </Field.Root>,
      );

      const [, input] = screen.getAllByRole<HTMLInputElement>('checkbox', {
        hidden: true,
      });
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

    it('[data-invalid]', async () => {
      await render(
        <Field.Root invalid>
          <Checkbox.Root data-testid="button" />
        </Field.Root>,
      );

      const button = screen.getByTestId('button');

      expect(button).to.have.attribute('data-invalid', '');
    });

    it('[data-valid]', async () => {
      await render(
        <Field.Root validationMode="onBlur">
          <Checkbox.Root data-testid="button" required />
        </Field.Root>,
      );

      const button = screen.getByTestId('button');

      expect(button).not.to.have.attribute('data-valid');
      expect(button).not.to.have.attribute('data-invalid');

      // Check the checkbox and trigger validation
      fireEvent.click(button);
      fireEvent.focus(button);
      fireEvent.blur(button);

      expect(button).to.have.attribute('data-valid', '');
      expect(button).not.to.have.attribute('data-invalid');
    });

    it('prop: validationMode=onSubmit', async () => {
      await render(
        <Form>
          <Field.Root>
            <Checkbox.Root required />
            <Field.Error data-testid="error" />
          </Field.Root>
          <button type="submit">submit</button>
        </Form>,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.to.have.attribute('aria-invalid');

      fireEvent.click(checkbox);
      expect(checkbox).to.have.attribute('data-checked', '');
      fireEvent.click(checkbox);
      expect(checkbox).to.have.attribute('data-unchecked', '');
      expect(checkbox).not.to.have.attribute('aria-invalid');

      fireEvent.click(screen.getByText('submit'));
      expect(checkbox).to.have.attribute('aria-invalid', 'true');

      fireEvent.click(checkbox);
      expect(checkbox).to.have.attribute('data-checked', '');
      expect(checkbox).not.to.have.attribute('aria-invalid');

      fireEvent.click(checkbox);
      expect(checkbox).to.have.attribute('data-unchecked', '');
      expect(checkbox).to.have.attribute('aria-invalid');

      fireEvent.click(checkbox);
      expect(checkbox).to.have.attribute('data-checked', '');
      expect(checkbox).not.to.have.attribute('aria-invalid');
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

    it('revalidates when a controlled value changes externally', async () => {
      const validateSpy = spy((value: unknown) => ((value as boolean) ? 'error' : null));

      function App() {
        const [checked, setChecked] = React.useState(false);

        return (
          <React.Fragment>
            <Field.Root validationMode="onChange" validate={validateSpy} name="terms">
              <Checkbox.Root data-testid="button" checked={checked} onCheckedChange={setChecked} />
            </Field.Root>
            <button type="button" onClick={() => setChecked((prev) => !prev)}>
              Toggle externally
            </button>
          </React.Fragment>
        );
      }

      await render(<App />);

      const button = screen.getByTestId('button');
      const toggle = screen.getByText('Toggle externally');

      expect(button).not.to.have.attribute('aria-invalid');
      const initialCallCount = validateSpy.callCount;

      fireEvent.click(toggle);

      expect(validateSpy.callCount).to.equal(initialCallCount + 1);
      expect(validateSpy.lastCall.args[0]).to.equal(true);
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

    describe('Field.Label', () => {
      describe('explicit association', () => {
        it('when label and checkbox are siblings', async () => {
          await render(
            <Field.Root>
              <Field.Label>Label</Field.Label>
              <Checkbox.Root />
            </Field.Root>,
          );

          const label = screen.getByText('Label');
          expect(label.getAttribute('id')).not.to.equal(null);

          const input = document.querySelector('input[type="checkbox"]');
          expect(label.getAttribute('for')).to.equal(input?.getAttribute('id'));

          const checkbox = screen.getByRole('checkbox');
          expect(checkbox.getAttribute('aria-labelledby')).to.equal(label.getAttribute('id'));
          expect(checkbox).to.have.attribute('aria-checked', 'false');

          fireEvent.click(label);
          expect(checkbox).to.have.attribute('aria-checked', 'true');
        });
      });

      describe('implicit association', () => {
        it('sets `for` on the label', async () => {
          await render(
            <Field.Root>
              <Field.Label data-testid="label">
                <Checkbox.Root />
                OK
              </Field.Label>
            </Field.Root>,
          );

          const label = screen.getByTestId('label');
          const input = document.querySelector('input[type="checkbox"]');
          expect(label.getAttribute('for')).to.not.equal(null);
          expect(label.getAttribute('for')).to.equal(input?.getAttribute('id'));

          const checkbox = screen.getByRole('checkbox');
          expect(label.getAttribute('id')).to.not.equal(null);
          expect(checkbox.getAttribute('aria-labelledby')).to.equal(label.getAttribute('id'));

          expect(checkbox).to.have.attribute('aria-checked', 'false');
          fireEvent.click(screen.getByText('OK'));
          expect(checkbox).to.have.attribute('aria-checked', 'true');
        });
      });
    });

    it('Field.Description', async () => {
      await render(
        <Field.Root>
          <Checkbox.Root data-testid="button" />
          <Field.Description data-testid="description" />
        </Field.Root>,
      );

      const internalInput = screen.getByRole<HTMLInputElement>('checkbox');

      expect(internalInput).to.have.attribute(
        'aria-describedby',
        screen.getByTestId('description').id,
      );
    });
  });

  it('should change state when clicking the checkbox if it has a wrapping label', async () => {
    await render(
      <label data-testid="label">
        <Checkbox.Root />
        Toggle
      </label>,
    );

    const [checkbox] = screen.getAllByRole('checkbox');

    expect(checkbox).to.have.attribute('aria-checked', 'false');

    fireEvent.click(checkbox);

    expect(checkbox).to.have.attribute('aria-checked', 'true');

    fireEvent.click(checkbox);

    expect(checkbox).to.have.attribute('aria-checked', 'false');
  });

  it('sets `aria-labelledby` from a sibling label associated with the hidden input', async () => {
    await render(
      <div>
        <label htmlFor="checkbox-input">Label</label>
        <Checkbox.Root id="checkbox-input" />
      </div>,
    );

    const label = screen.getByText('Label');
    expect(label.id).not.to.equal('');
    expect(screen.getByRole('checkbox')).to.have.attribute('aria-labelledby', label.id);
  });

  it('updates fallback `aria-labelledby` when the hidden input id changes', async () => {
    function TestCase() {
      const [id, setId] = React.useState('checkbox-input-a');

      return (
        <React.Fragment>
          <label htmlFor="checkbox-input-a">Label A</label>
          <label htmlFor="checkbox-input-b">Label B</label>
          <Checkbox.Root id={id} />
          <button type="button" onClick={() => setId('checkbox-input-b')}>
            Toggle
          </button>
        </React.Fragment>
      );
    }

    await render(<TestCase />);

    const checkbox = screen.getByRole('checkbox');
    const labelA = screen.getByText('Label A');

    expect(labelA.id).to.not.equal('');
    expect(checkbox).to.have.attribute('aria-labelledby', labelA.id);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));

    await waitFor(() => {
      const labelB = screen.getByText('Label B');

      expect(labelB.id).to.not.equal('');
      expect(labelA.id).to.not.equal(labelB.id);
      expect(checkbox).to.have.attribute('aria-labelledby', labelB.id);
    });
  });

  it('can render a native button', async () => {
    const { container, user } = await render(<Checkbox.Root render={<button />} nativeButton />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).to.have.attribute('aria-checked', 'false');
    // eslint-disable-next-line testing-library/no-container
    expect(container.querySelector('button')).to.equal(checkbox);

    await user.keyboard('[Tab]');
    expect(checkbox).toHaveFocus();

    await user.keyboard('[Enter]');
    expect(checkbox).to.have.attribute('aria-checked', 'true');

    await user.keyboard('[Space]');
    expect(checkbox).to.have.attribute('aria-checked', 'false');

    await user.click(checkbox);
    expect(checkbox).to.have.attribute('aria-checked', 'true');
  });
});
