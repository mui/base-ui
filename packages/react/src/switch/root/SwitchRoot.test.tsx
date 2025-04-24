import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { Switch } from '@base-ui-components/react/switch';
import { userEvent } from '@testing-library/user-event';
import { describeConformance, createRenderer, isJSDOM } from '#test-utils';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';

describe('<Switch.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Switch.Root />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render,
  }));

  describe('interaction', () => {
    it('should change its state when clicked', async () => {
      const { getByRole } = await render(<Switch.Root />);
      const switchElement = getByRole('switch');

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

      const { getByRole, getByText } = await render(<Test />);
      const switchElement = getByRole('switch');
      const button = getByText('Toggle');

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
      const { getByRole } = await render(<Switch.Root onCheckedChange={handleChange} />);
      const switchElement = getByRole('switch');

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
      const { getByRole } = await render(<Switch.Root onClick={handleClick} />);
      const switchElement = getByRole('switch');

      await act(async () => {
        switchElement.click();
      });

      expect(handleClick.callCount).to.equal(1);
    });
  });

  describe('prop: disabled', () => {
    it('should have the `disabled` attribute', async () => {
      const { getByRole } = await render(<Switch.Root disabled />);
      expect(getByRole('switch')).to.have.attribute('disabled');
    });

    it('should not have the `disabled` attribute when `disabled` is not set', async () => {
      const { getByRole } = await render(<Switch.Root />);
      expect(getByRole('switch')).not.to.have.attribute('disabled');
    });

    it('should not change its state when clicked', async () => {
      const { getByRole } = await render(<Switch.Root disabled />);
      const switchElement = getByRole('switch');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      await act(async () => {
        switchElement.click();
      });

      expect(switchElement).to.have.attribute('aria-checked', 'false');
    });
  });

  describe('prop: readOnly', () => {
    it('should have the `aria-readonly` attribute', async () => {
      const { getByRole } = await render(<Switch.Root readOnly />);
      expect(getByRole('switch')).to.have.attribute('aria-readonly', 'true');
    });

    it('should not have the aria attribute when `readOnly` is not set', async () => {
      const { getByRole } = await render(<Switch.Root />);
      expect(getByRole('switch')).not.to.have.attribute('aria-readonly');
    });

    it('should not change its state when clicked', async () => {
      const { getByRole } = await render(<Switch.Root readOnly />);
      const switchElement = getByRole('switch');

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

  it('should set the name attribute on the input', async () => {
    const { getByRole } = await render(<Switch.Root name="switch-name" />);
    const input = getByRole('checkbox', { hidden: true });

    expect(input).to.have.attribute('name', 'switch-name');
  });

  describe('Form', () => {
    const user = userEvent.setup();

    it('should toggle the switch when a parent label is clicked', async () => {
      const { getByTestId, getByRole } = await render(
        <label data-testid="label">
          <Switch.Root />
          Toggle
        </label>,
      );

      const switchElement = getByRole('switch');
      const label = getByTestId('label');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      await user.click(label);

      expect(switchElement).to.have.attribute('aria-checked', 'true');
    });

    it('should toggle the switch when a linked label is clicked', async () => {
      const { getByTestId, getByRole } = await render(
        <div>
          <label htmlFor="test-switch" data-testid="label">
            Toggle
          </label>
          <Switch.Root id="test-switch" />
        </div>,
      );

      const switchElement = getByRole('switch');
      const label = getByTestId('label');

      expect(switchElement).to.have.attribute('aria-checked', 'false');

      await user.click(label);

      expect(switchElement).to.have.attribute('aria-checked', 'true');
    });

    it('should include the switch value in the form submission', async ({ skip }) => {
      if (isJSDOM) {
        // FormData is not available in JSDOM
        skip();
      }

      let stringifiedFormData = '';

      const { getByRole } = await render(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            stringifiedFormData = new URLSearchParams(formData as any).toString();
          }}
        >
          <Switch.Root name="test-switch" />
          <button type="submit">Submit</button>
        </form>,
      );

      const switchElement = getByRole('switch');
      const submitButton = getByRole('button')!;

      submitButton.click();

      expect(stringifiedFormData).to.equal('test-switch=off');

      await act(async () => {
        switchElement.click();
      });

      submitButton.click();

      expect(stringifiedFormData).to.equal('test-switch=on');
    });

    it('clears errors on change', async () => {
      function App() {
        const [errors, setErrors] = React.useState<Record<string, string | string[]>>({
          test: 'test',
        });
        return (
          <Form errors={errors} onClearErrors={setErrors}>
            <Field.Root name="test" data-testid="field">
              <Switch.Root data-testid="switch" />
              <Field.Error data-testid="error" />
            </Field.Root>
          </Form>
        );
      }

      await render(<App />);

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
      const { getByRole } = await render(
        <Field.Root disabled>
          <Switch.Root />
        </Field.Root>,
      );

      const switchElement = getByRole('switch');
      expect(switchElement).to.have.attribute('disabled');
    });

    it('should receive name prop from Field.Root', async () => {
      const { getByRole } = await render(
        <Field.Root name="field-switch">
          <Switch.Root />
        </Field.Root>,
      );

      const input = getByRole('checkbox', { hidden: true });
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

    it('prop: validate', async () => {
      await render(
        <Field.Root validate={() => 'error'}>
          <Switch.Root data-testid="button" />
          <Field.Error data-testid="error" />
        </Field.Root>,
      );

      const button = screen.getByTestId('button');

      expect(button).not.to.have.attribute('aria-invalid');

      fireEvent.focus(button);
      fireEvent.blur(button);

      expect(button).to.have.attribute('aria-invalid', 'true');
    });

    it('Field.Label', async () => {
      await render(
        <Field.Root>
          <Switch.Root data-testid="button" />
          <Field.Label data-testid="label" />
        </Field.Root>,
      );

      const button = screen.getByTestId('button');

      expect(screen.getByTestId('label')).to.have.attribute('for', button.id);
    });

    it('Field.Description', async () => {
      const { container } = await render(
        <Field.Root>
          <Switch.Root data-testid="button" />
          <Field.Description data-testid="description" />
        </Field.Root>,
      );

      // eslint-disable-next-line testing-library/no-node-access
      const internalInput = container.querySelector<HTMLInputElement>('input[type="checkbox"]');

      expect(internalInput).to.have.attribute(
        'aria-describedby',
        screen.getByTestId('description').id,
      );
    });
  });
});
