import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { Switch } from '@base-ui-components/react/switch';
import { describeConformance, createRenderer, isJSDOM } from '#test-utils';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';

describe('<Switch.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Switch.Root />, () => ({
    refInstanceof: window.HTMLSpanElement,
    testComponentPropWith: 'span',
    button: true,
    render,
  }));

  describe('interactions', () => {
    it('should change its state when clicked', async () => {
      await render(<Switch.Root />);
      const switchElement = screen.getByRole('switch');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      await act(async () => {
        switchElement.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'true');
    });

    it('should update its state when changed from outside', async () => {
      function Test() {
        const [checked, setChecked] = React.useState(false);
        return (
          <div>
            <button onClick={() => setChecked((c) => !c)}>Toggle</button>
            <Switch.Root checked={checked} />;
          </div>
        );
      }

      await render(<Test />);
      const switchElement = screen.getByRole('switch');
      const button = screen.getByText('Toggle');

      expect(switchElement).to.have.attribute('aria-checked', 'false');
      await act(async () => {
        button.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'true');

      await act(async () => {
        button.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'false');
    });

    it('should update its state if the underlying input is toggled', async () => {
      await render(<Switch.Root />);
      const switchElement = screen.getByRole('switch');
      const internalInput = screen.getByRole('checkbox', { hidden: true });

      await act(async () => {
        internalInput.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'true');
    });

    ['Enter', 'Space'].forEach((key) => {
      it(`can be activated with ${key} key`, async () => {
        const { user } = await render(<Switch.Root />);

        const switchEl = screen.getByRole('switch');
        expect(switchEl).to.have.attribute('aria-checked', 'false');

        await user.keyboard('[Tab]');
        expect(switchEl).toHaveFocus();

        await user.keyboard(`[${key}]`);
        expect(switchEl).to.have.attribute('aria-checked', 'true');
      });
    });
  });

  describe('extra props', () => {
    it('should override the built-in attributes', async () => {
      await render(<Switch.Root role="checkbox" data-testid="switch" />);
      expect(screen.getByTestId('switch')).to.have.attribute('role', 'checkbox');
    });
  });

  describe('prop: onChange', () => {
    it('should call onChange when clicked', async () => {
      const handleChange = spy();
      await render(<Switch.Root onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      await act(async () => {
        switchElement.click();
      });

      expect(handleChange.callCount).to.equal(1);
      expect(handleChange.firstCall.args[0]).to.equal(true);
    });
  });

  describe('prop: onClick', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = spy();
      await render(<Switch.Root onClick={handleClick} />);
      const switchElement = screen.getByRole('switch');

      await act(async () => {
        switchElement.click();
      });

      expect(handleClick.callCount).to.equal(1);
    });
  });

  describe('prop: disabled', () => {
    it('uses aria-disabled instead of HTML disabled', async () => {
      await render(<Switch.Root disabled />);
      expect(screen.getByRole('switch')).to.not.have.attribute('disabled');
      expect(screen.getByRole('switch')).to.have.attribute('aria-disabled', 'true');
    });

    it('should not have the `disabled` attribute when `disabled` is not set', async () => {
      await render(<Switch.Root />);
      expect(screen.getByRole('switch')).not.to.have.attribute('disabled');
    });

    it('should not change its state when clicked', async () => {
      await render(<Switch.Root disabled />);
      const switchElement = screen.getByRole('switch');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      await act(async () => {
        switchElement.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: readOnly', () => {
    it('should have the `aria-readonly` attribute', async () => {
      await render(<Switch.Root readOnly />);
      expect(screen.getByRole('switch')).to.have.attribute('aria-readonly', 'true');
    });

    it('should not have the aria attribute when `readOnly` is not set', async () => {
      await render(<Switch.Root />);
      expect(screen.getByRole('switch')).not.to.have.attribute('aria-readonly');
    });

    it('should not change its state when clicked', async () => {
      await render(<Switch.Root readOnly />);
      const switchElement = screen.getByRole('switch');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      await act(async () => {
        switchElement.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: inputRef', () => {
    it('should be able to access the native input', async () => {
      const inputRef = React.createRef<HTMLInputElement>();
      await render(<Switch.Root inputRef={inputRef} />);
      const internalInput = screen.getByRole('checkbox', { hidden: true });

      expect(inputRef.current).to.equal(internalInput);
    });
  });

  it('should place the style hooks on the root and the thumb', async () => {
    const { setProps } = await render(
      <Switch.Root defaultChecked disabled readOnly required>
        <Switch.Thumb data-testid="thumb" />
      </Switch.Root>,
    );

    const switchElement = screen.getByRole('switch');
    const thumb = screen.getByTestId('thumb');

    expect(switchElement).to.have.attribute('data-checked', '');
    expect(switchElement).to.have.attribute('data-disabled', '');
    expect(switchElement).to.have.attribute('data-readonly', '');
    expect(switchElement).to.have.attribute('data-required', '');

    expect(thumb).to.have.attribute('data-checked', '');
    expect(thumb).to.have.attribute('data-disabled', '');
    expect(thumb).to.have.attribute('data-readonly', '');
    expect(thumb).to.have.attribute('data-required', '');

    await setProps({ disabled: false, readOnly: false });
    fireEvent.click(switchElement);

    expect(switchElement).to.have.attribute('data-unchecked', '');
    expect(switchElement).not.to.have.attribute('data-checked');

    expect(thumb).to.have.attribute('data-unchecked', '');
    expect(thumb).not.to.have.attribute('data-checked');
  });

  it('should set the name attribute only on the input', async () => {
    await render(<Switch.Root name="switch-name" />);

    const switchElement = screen.getByRole('switch');
    const input = screen.getByRole('checkbox', { hidden: true });

    expect(input).to.have.attribute('name', 'switch-name');
    expect(switchElement).not.to.have.attribute('name');
  });

  describe('with native <label>', () => {
    it('should toggle the switch when a wrapping <label> is clicked', async () => {
      const { user } = await render(
        <label data-testid="label">
          <Switch.Root />
          Toggle
        </label>,
      );

      const switchElement = screen.getByRole('switch');
      expect(switchElement).to.have.attribute('aria-checked', 'false');

      await user.click(screen.getByTestId('label'));
      expect(switchElement).to.have.attribute('aria-checked', 'true');
    });

    it('should toggle the switch when a explicitly linked <label> is clicked', async () => {
      const { user } = await render(
        <div>
          <label data-testid="label" htmlFor="mySwitch">
            Toggle
          </label>

          <Switch.Root id="mySwitch" />
        </div>,
      );

      const switchElement = screen.getByRole('switch');
      expect(switchElement).to.have.attribute('aria-checked', 'false');

      await user.click(screen.getByTestId('label'));
      expect(switchElement).to.have.attribute('aria-checked', 'true');
    });
  });

  describe('Form', () => {
    // FormData is not available in JSDOM
    it.skipIf(isJSDOM)('should include the switch value in form submission', async () => {
      const submitSpy = spy((event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        return formData.get('test-switch');
      });

      const { user } = await render(
        <Form onSubmit={submitSpy}>
          <Field.Root name="test-switch">
            <Switch.Root />
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      const switchElement = screen.getByRole('switch');
      const submitButton = screen.getByRole('button')!;

      await user.click(submitButton);

      expect(submitSpy.callCount).to.equal(1);
      expect(submitSpy.lastCall.returnValue).to.equal('off');

      await user.click(switchElement);
      await user.click(submitButton);

      expect(submitSpy.callCount).to.equal(2);
      expect(submitSpy.lastCall.returnValue).to.equal('on');
    });

    it('triggers native HTML validation on submit', async () => {
      const { user } = await render(
        <Form>
          <Field.Root name="test">
            <Switch.Root name="switch" required />
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
            <Switch.Root data-testid="switch" />
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>,
      );

      const switchElement = screen.getByTestId('switch');

      expect(switchElement).to.have.attribute('aria-invalid', 'true');
      expect(screen.queryByTestId('error')).to.have.text('test');

      fireEvent.click(switchElement);

      expect(switchElement).not.to.have.attribute('aria-invalid');
      expect(screen.queryByTestId('error')).to.equal(null);
    });
  });

  describe('Field', () => {
    it('should receive disabled prop from Field.Root', async () => {
      await render(
        <Field.Root disabled>
          <Switch.Root />
        </Field.Root>,
      );

      const switchElement = screen.getByRole('switch');
      expect(switchElement).to.have.attribute('data-disabled');
    });

    it('should receive name prop from Field.Root', async () => {
      await render(
        <Field.Root name="field-switch">
          <Switch.Root />
        </Field.Root>,
      );

      const input = screen.getByRole('checkbox', { hidden: true });
      expect(input).to.have.attribute('name', 'field-switch');
    });

    it('[data-touched]', async () => {
      await render(
        <Field.Root>
          <Switch.Root data-testid="button" />
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
          <Switch.Root data-testid="button" />
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
            <Switch.Root data-testid="button" />
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
            <Switch.Root data-testid="button" defaultChecked />
          </Field.Root>,
        );

        const button = screen.getByTestId('button');

        expect(button).to.have.attribute('data-filled');

        fireEvent.click(button);

        expect(button).not.to.have.attribute('data-filled', '');
      });
    });

    it('[data-focused]', async () => {
      await render(
        <Field.Root>
          <Switch.Root data-testid="button" />
        </Field.Root>,
      );

      const button = screen.getByTestId('button');

      expect(button).not.to.have.attribute('data-focused');

      fireEvent.focus(button);

      expect(button).to.have.attribute('data-focused', '');

      fireEvent.blur(button);

      expect(button).not.to.have.attribute('data-focused');
    });

    it('prop: validationMode=onSubmit', async () => {
      await render(
        <Form>
          <Field.Root>
            <Switch.Root required />
            <Field.Error data-testid="error" />
          </Field.Root>
          <button type="submit">submit</button>
        </Form>,
      );

      const button = screen.getByRole('switch');
      expect(button).not.to.have.attribute('aria-invalid');

      fireEvent.click(screen.getByText('submit'));
      expect(button).to.have.attribute('aria-invalid', 'true');
      expect(screen.queryByTestId('error')).to.not.equal(null);

      fireEvent.click(button);
      expect(button).not.to.have.attribute('aria-invalid');
      expect(screen.queryByTestId('error')).to.equal(null);

      fireEvent.click(button);
      expect(button).to.have.attribute('aria-invalid', 'true');
      expect(screen.queryByTestId('error')).to.not.equal(null);
    });

    it('prop: validationMode=onChange', async () => {
      await render(
        <Field.Root
          validationMode="onChange"
          validate={(value) => {
            const checked = value as boolean;
            return checked ? 'error' : null;
          }}
        >
          <Switch.Root data-testid="button" />
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
            <Field.Root validationMode="onChange" validate={validateSpy} name="newsletters">
              <Switch.Root data-testid="button" checked={checked} onCheckedChange={setChecked} />
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
          <Switch.Root data-testid="button" />
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
      describe('implicit', () => {
        it('sets `for` on the label', async () => {
          await render(
            <Field.Root>
              <Field.Label data-testid="label">
                <Switch.Root />
                OK
              </Field.Label>
            </Field.Root>,
          );

          const label = screen.getByTestId('label');
          expect(label.getAttribute('for')).not.to.equal(null);

          const input = document.querySelector('input[type="checkbox"]');
          expect(label.getAttribute('for')).to.equal(input?.getAttribute('id'));

          const switchEl = screen.getByRole('switch');
          expect(switchEl.getAttribute('aria-labelledby')).to.equal(label.getAttribute('id'));
          expect(switchEl).to.have.attribute('aria-checked', 'false');

          fireEvent.click(label);
          expect(switchEl).to.have.attribute('aria-checked', 'true');
        });
      });

      describe('explicit association', () => {
        it('when the label is sibling to the switch', async () => {
          await render(
            <Field.Root>
              <Field.Label data-testid="label">Label</Field.Label>
              <Switch.Root />
            </Field.Root>,
          );

          const label = screen.getByTestId('label');
          const switchEl = screen.getByRole('switch');
          const input = document.querySelector('input[type="checkbox"]');

          expect(label.getAttribute('for')).not.to.equal(null);

          expect(label.getAttribute('for')).to.equal(input?.getAttribute('id'));
          expect(switchEl.getAttribute('aria-labelledby')).to.equal(label.getAttribute('id'));

          expect(switchEl).to.have.attribute('aria-checked', 'false');

          fireEvent.click(label);
          expect(switchEl).to.have.attribute('aria-checked', 'true');
        });

        it('when rendering a non-native button', async () => {
          await render(
            <Field.Root>
              <Field.Label data-testid="label">OK</Field.Label>
              <Switch.Root render={<span />} nativeButton={false} />
            </Field.Root>,
          );

          const label = screen.getByTestId('label');
          expect(label.getAttribute('for')).not.to.equal(null);
          const input = document.querySelector('input[type="checkbox"]');
          expect(input?.getAttribute('id')).to.equal(label.getAttribute('for'));
          const switchEl = screen.getByRole('switch');
          expect(switchEl.getAttribute('aria-labelledby')).to.equal(label.getAttribute('id'));
        });

        it('when rendering a non-native label', async () => {
          await render(
            <Field.Root>
              <Field.Label data-testid="label" render={<span />}>
                <Switch.Root data-testid="button" />
              </Field.Label>
            </Field.Root>,
          );

          const label = screen.getByTestId('label');
          const switchEl = screen.getByRole('switch');
          const input = document.querySelector('input[type="checkbox"]');

          expect(label.getAttribute('for')).not.to.equal(null);
          expect(label.getAttribute('id')).not.to.equal(null);

          expect(label.getAttribute('for')).to.equal(input?.getAttribute('id'));
          expect(switchEl.getAttribute('aria-labelledby')).to.equal(label.getAttribute('id'));

          expect(switchEl).to.have.attribute('aria-checked', 'false');

          // non-native labels cannot toggle a non-native-button switch
          fireEvent.click(label);
          expect(switchEl).to.not.have.attribute('aria-checked', 'true');
        });
      });
    });

    it('Field.Description', async () => {
      await render(
        <Field.Root>
          <Switch.Root data-testid="button" />
          <Field.Description data-testid="description" />
        </Field.Root>,
      );

      const internalInput = screen.queryByRole<HTMLInputElement>('checkbox', { hidden: true });

      expect(internalInput).to.have.attribute(
        'aria-describedby',
        screen.getByTestId('description').id,
      );
    });
  });

  it('can render a native button', async () => {
    const { container, user } = await render(<Switch.Root render={<button />} nativeButton />);

    const switchEl = screen.getByRole('switch');
    expect(switchEl).to.have.attribute('aria-checked', 'false');
    // eslint-disable-next-line testing-library/no-container
    expect(container.querySelector('button')).to.equal(switchEl);

    await user.keyboard('[Tab]');
    expect(switchEl).toHaveFocus();

    await user.keyboard('[Enter]');
    expect(switchEl).to.have.attribute('aria-checked', 'true');

    await user.keyboard('[Space]');
    expect(switchEl).to.have.attribute('aria-checked', 'false');

    await user.click(switchEl);
    expect(switchEl).to.have.attribute('aria-checked', 'true');
  });
});
