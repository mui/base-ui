import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Form } from '@base-ui/react/form';
import { Checkbox } from '@base-ui/react/checkbox';
import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import { NumberField } from '@base-ui/react/number-field';
import { Switch } from '@base-ui/react/switch';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Radio } from '@base-ui/react/radio';
import { Select } from '@base-ui/react/select';
import { Combobox } from '@base-ui/react/combobox';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Slider } from '@base-ui/react/slider';
import { OTPField } from '@base-ui/react/otp-field';
import { act, fireEvent, flushMicrotasks, screen, waitFor, within } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Form />', () => {
  const { render } = createRenderer();

  describeConformance(<Form />, () => ({
    refInstanceof: window.HTMLFormElement,
    render,
  }));

  it('does not submit if there are errors', async () => {
    const onSubmit = vi.fn();

    const { user } = await render(
      <Form onSubmit={onSubmit}>
        <Field.Root>
          <Field.Control required />
          <Field.Error data-testid="error" />
        </Field.Root>
        <button>Submit</button>
      </Form>,
    );

    const submit = screen.getByRole('button');

    await user.click(submit);

    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(onSubmit.mock.calls.length > 0).toBe(false);
  });

  it('blocks submit and focuses the first invalid field across custom and native validation', async () => {
    const onFormSubmit = vi.fn();
    const select = vi.spyOn(HTMLInputElement.prototype, 'select');

    try {
      const { user } = await render(
        <Form onFormSubmit={onFormSubmit}>
          <Field.Root name="custom" validate={() => 'custom error'}>
            <Field.Control data-testid="custom" />
          </Field.Root>
          <Field.Root name="native">
            <Field.Control data-testid="native" required />
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(onFormSubmit).not.toHaveBeenCalled();
      expect(screen.getByTestId('custom')).toHaveFocus();
      expect(select).toHaveBeenCalledTimes(1);
    } finally {
      select.mockRestore();
    }
  });

  it('keeps focusing the first invalid field after a control value changes', async () => {
    const { user } = await render(
      <Form>
        <Field.Root name="a">
          <Checkbox.Root required data-testid="a" />
        </Field.Root>
        <Field.Root name="b">
          <Checkbox.Root required data-testid="b" />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>,
    );

    const checkboxA = screen.getByTestId('a');
    const submit = screen.getByRole('button', { name: 'Submit' });

    await user.click(submit);
    expect(checkboxA).toHaveFocus();

    // Toggling the checkbox updates its field control registration.
    await user.click(checkboxA);
    await user.click(checkboxA);

    await user.click(submit);
    expect(checkboxA).toHaveFocus();
  });

  it('keeps the registration-order focus fallback stable across disconnected trees', async () => {
    const firstHost = document.createElement('div');
    const secondHost = document.createElement('div');
    const firstContainer = document.createElement('div');
    const secondContainer = document.createElement('div');
    const firstRoot = firstHost.attachShadow({ mode: 'open' });
    const secondRoot = secondHost.attachShadow({ mode: 'open' });
    firstRoot.append(firstContainer);
    secondRoot.append(secondContainer);
    document.body.append(firstHost, secondHost);

    try {
      const { unmount } = await render(
        <Form>
          {ReactDOM.createPortal(
            <Field.Root name="a">
              <Checkbox.Root required data-testid="a" />
            </Field.Root>,
            firstContainer,
          )}
          {ReactDOM.createPortal(
            <Field.Root name="b">
              <Checkbox.Root required data-testid="b" />
            </Field.Root>,
            secondContainer,
          )}
          <button type="submit">Submit</button>
        </Form>,
      );

      try {
        const checkboxA = within(firstContainer).getByTestId('a');
        const submit = screen.getByRole('button', { name: 'Submit' });
        const form = submit.closest('form');
        if (!form) {
          throw new Error('Expected submit button to be inside a form');
        }

        fireEvent.submit(form);
        expect(firstRoot.activeElement).toBe(checkboxA);

        fireEvent.click(checkboxA);
        fireEvent.click(checkboxA);
        fireEvent.submit(form);

        expect(firstRoot.activeElement).toBe(checkboxA);
      } finally {
        unmount();
      }
    } finally {
      firstHost.remove();
      secondHost.remove();
    }
  });

  it('focuses the first invalid field in document order when keyed fields are reordered', async () => {
    function App() {
      const [names, setNames] = React.useState(['a', 'b']);
      return (
        <React.Fragment>
          <button type="button" onClick={() => setNames(['b', 'a'])}>
            Reorder
          </button>
          <Form>
            {names.map((name) => (
              <Field.Root key={name} name={name}>
                <Checkbox.Root required data-testid={name} />
              </Field.Root>
            ))}
            <button type="submit">Submit</button>
          </Form>
        </React.Fragment>
      );
    }

    // Strict Mode re-runs effects when a keyed subtree moves, which would re-register
    // the fields in DOM order and mask the registration/DOM order divergence.
    const { user } = await render(<App />, { strict: false });

    // Keyed reorder moves the DOM nodes without remounting, so the internal
    // registration Map keeps the original order while the DOM order flips.
    await user.click(screen.getByRole('button', { name: 'Reorder' }));

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByTestId('b')).toHaveFocus();
  });

  it('submits when a valid async validator is pending', async () => {
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
    });
    const validate = vi.fn(() => new Promise<null>(() => {}));

    await render(
      <Form onSubmit={onSubmit}>
        <Field.Root validate={validate}>
          <Field.Control />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(validate).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('re-runs an onBlur cross-field validator on submit', async () => {
    const onFormSubmit = vi.fn();
    const validate = vi.fn((value: unknown, formValues: Form.Values) =>
      value !== formValues.password ? 'Passwords do not match' : null,
    );

    await render(
      <Form onFormSubmit={onFormSubmit}>
        <Field.Root name="password" validationMode="onBlur">
          <Field.Control data-testid="password" />
        </Field.Root>
        <Field.Root name="confirmPassword" validationMode="onBlur" validate={validate}>
          <Field.Control data-testid="confirm" />
          <Field.Error data-testid="confirm-error" />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>,
    );

    const password = screen.getByTestId('password');
    const confirm = screen.getByTestId('confirm');

    fireEvent.change(password, { target: { value: 'secret' } });
    fireEvent.change(confirm, { target: { value: 'typo' } });
    fireEvent.blur(confirm);

    expect(validate).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('confirm-error')).toHaveTextContent('Passwords do not match');

    fireEvent.change(password, { target: { value: 'typo' } });
    fireEvent.blur(password);

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(validate).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId('confirm-error')).toBe(null);
    expect(onFormSubmit).toHaveBeenCalledTimes(1);
  });

  it('retires a stale async validation result on the next submit', async () => {
    const onFormSubmit = vi.fn();
    const validate = vi.fn((value: unknown) =>
      Promise.resolve(value === 'bad' ? 'async error' : null),
    );

    await render(
      <Form onFormSubmit={onFormSubmit}>
        <Field.Root name="field" validationMode="onSubmit" validate={validate}>
          <Field.Control data-testid="control" defaultValue="bad" />
          <Field.Error data-testid="error" />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>,
    );

    const control = screen.getByTestId('control');
    const submit = screen.getByRole('button', { name: 'Submit' });

    fireEvent.click(submit);

    expect(onFormSubmit).toHaveBeenCalledTimes(1);

    await flushMicrotasks();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('async error');
    });

    fireEvent.change(control, { target: { value: 'good' } });
    fireEvent.click(submit);

    expect(onFormSubmit).toHaveBeenCalledTimes(2);

    expect(screen.queryByTestId('error')).toBe(null);

    await flushMicrotasks();
  });

  it.each([{ validationMode: 'onBlur' as const }, { validationMode: 'onChange' as const }])(
    'blocks submission on a resolved async error in $validationMode mode',
    async ({ validationMode }) => {
      const onFormSubmit = vi.fn();
      const validate = vi.fn((value: unknown) =>
        Promise.resolve(value === 'taken' ? 'Username is taken' : null),
      );

      await render(
        <Form onFormSubmit={onFormSubmit}>
          <Field.Root name="username" validationMode={validationMode} validate={validate}>
            <Field.Control data-testid="control" />
            <Field.Error data-testid="error" />
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      const control = screen.getByTestId('control');

      fireEvent.change(control, { target: { value: 'taken' } });
      fireEvent.blur(control);
      await flushMicrotasks();

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Username is taken');
      });

      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      expect(onFormSubmit).not.toHaveBeenCalled();
      expect(screen.getByTestId('error')).toHaveTextContent('Username is taken');

      await flushMicrotasks();
    },
  );

  it('does not submit if an unnamed registered field control is invalid', async () => {
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
    });

    const { user } = await render(
      <Form onSubmit={onSubmit}>
        <Field.Root>
          <Switch.Root required />
          <Field.Error data-testid="error" />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>,
    );

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId('error')).toBeInTheDocument();
  });

  it('clears invalid state for an unnamed registered field control on change', async () => {
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
    });

    const { user } = await render(
      <Form onSubmit={onSubmit}>
        <Field.Root>
          <Switch.Root required />
          <Field.Error data-testid="error" />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>,
    );

    const submit = screen.getByRole('button', { name: 'Submit' });
    const switchControl = screen.getByRole('switch');

    await user.click(submit);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(switchControl).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId('error')).toBeInTheDocument();

    await user.click(switchControl);

    expect(switchControl).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByTestId('error')).toBe(null);

    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('keeps same-name field validity scoped on submit', async () => {
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
    });

    const { user } = await render(
      <Form onSubmit={onSubmit}>
        <Field.Root name="shared">
          <Switch.Root required data-testid="first" />
          <Field.Error data-testid="first-error" />
        </Field.Root>
        <Field.Root name="shared">
          <Switch.Root required defaultChecked data-testid="second" />
          <Field.Error data-testid="second-error" />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>,
    );

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('first')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId('first-error')).toBeInTheDocument();
    expect(screen.getByTestId('second')).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByTestId('second-error')).toBe(null);
  });

  it('removes the previous registered field id when another control takes over', async () => {
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
    });

    const { user } = await render(
      <Form onSubmit={onSubmit}>
        <Field.Root>
          <Switch.Root required data-testid="first" />
          <Switch.Root required defaultChecked data-testid="second" />
          <Field.Error data-testid="error" />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>,
    );

    const submit = screen.getByRole('button', { name: 'Submit' });

    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('error')).toBe(null);
    expect(screen.getByTestId('first')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByTestId('second')).not.toHaveAttribute('aria-invalid');
  });

  it('unmounted fields should be removed from the form', async () => {
    const submitSpy = vi.fn((event) => event.preventDefault());
    function App() {
      const [checked, setChecked] = React.useState(true);

      return (
        <Form onSubmit={submitSpy}>
          <Field.Root name="name">
            <Field.Control defaultValue="Alice" />
          </Field.Root>

          <input type="checkbox" checked={checked} onChange={() => setChecked(!checked)} />

          {checked && (
            <Field.Root name="email">
              <Field.Control defaultValue="" required data-testid="email" />
            </Field.Root>
          )}

          <button>Submit</button>
        </Form>
      );
    }

    const { user } = await render(<App />);

    const submit = screen.getByText('Submit');

    await user.click(submit);
    expect(submitSpy.mock.calls.length).toBe(0);
    expect(screen.getByTestId('email')).toHaveAttribute('aria-invalid', 'true');

    await user.click(screen.getByRole('checkbox'));
    await user.click(submit);
    expect(submitSpy.mock.calls.length).toBe(1);
  });

  it('excludes disabled fieldset fields from validation and onFormSubmit values', async () => {
    const handleSubmit = vi.fn();

    await render(
      <Form onFormSubmit={handleSubmit}>
        <Fieldset.Root disabled>
          <Field.Root name="disabled">
            <Field.Control required data-testid="disabled" />
          </Field.Root>
        </Fieldset.Root>
        <Field.Root name="enabled">
          <Field.Control defaultValue="sent" />
        </Field.Root>
        <button type="submit">Submit</button>
      </Form>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit.mock.lastCall?.[0]).toEqual({ enabled: 'sent' });
    expect(screen.getByTestId('disabled')).not.toHaveAttribute('aria-invalid');
  });

  it('clears invalid UI when a fieldset field becomes disabled', async () => {
    const handleSubmit = vi.fn();

    function App() {
      const [disabled, setDisabled] = React.useState(false);

      return (
        <Form onFormSubmit={handleSubmit}>
          <Fieldset.Root disabled={disabled}>
            <Field.Root name="disabled">
              <Field.Control required data-testid="control" />
              <Field.Error data-testid="error" />
            </Field.Root>
          </Fieldset.Root>
          <button type="button" onClick={() => setDisabled(true)}>
            Disable
          </button>
          <button type="button" onClick={() => setDisabled(false)}>
            Enable
          </button>
          <button type="submit">Submit</button>
        </Form>
      );
    }

    const { user } = await render(<App />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('control')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId('error')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Disable' }));

    expect(screen.getByTestId('control')).toBeDisabled();
    expect(screen.getByTestId('control')).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByTestId('error')).toBe(null);

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit.mock.lastCall?.[0]).toEqual({});

    await user.click(screen.getByRole('button', { name: 'Enable' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('control')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId('error')).toBeInTheDocument();
  });

  it('clears invalid attributes when a field control becomes disabled', async () => {
    const handleSubmit = vi.fn();

    function App() {
      const [disabled, setDisabled] = React.useState(false);

      return (
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="disabled">
            <Field.Control disabled={disabled} required data-testid="control" />
          </Field.Root>
          <button type="button" onClick={() => setDisabled(true)}>
            Disable
          </button>
          <button type="submit">Submit</button>
        </Form>
      );
    }

    const { user } = await render(<App />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByTestId('control')).toHaveAttribute('aria-invalid', 'true');

    await user.click(screen.getByRole('button', { name: 'Disable' }));

    expect(screen.getByTestId('control')).toBeDisabled();
    expect(screen.getByTestId('control')).not.toHaveAttribute('aria-invalid');

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit.mock.lastCall?.[0]).toEqual({});
  });

  it('re-registers field controls when they become enabled again', async () => {
    const handleSubmit = vi.fn();

    function App() {
      const [disabled, setDisabled] = React.useState(false);

      return (
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="control">
            <Field.Control disabled={disabled} required data-testid="control" />
          </Field.Root>
          <button type="button" onClick={() => setDisabled(true)}>
            Disable
          </button>
          <button type="button" onClick={() => setDisabled(false)}>
            Enable
          </button>
          <button type="submit">Submit</button>
        </Form>
      );
    }

    const { user } = await render(<App />);
    const submit = screen.getByRole('button', { name: 'Submit' });

    await user.click(submit);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('control')).toHaveAttribute('aria-invalid', 'true');

    await user.click(screen.getByRole('button', { name: 'Disable' }));
    await user.click(submit);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit.mock.lastCall?.[0]).toEqual({});

    await user.click(screen.getByRole('button', { name: 'Enable' }));
    await user.click(submit);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('control')).toHaveAttribute('aria-invalid', 'true');

    await user.type(screen.getByTestId('control'), 'sent');
    await user.click(submit);

    expect(handleSubmit).toHaveBeenCalledTimes(2);
    expect(handleSubmit.mock.lastCall?.[0]).toEqual({ control: 'sent' });
  });

  describe('prop: errors', () => {
    it('should mark <Field.Control> as invalid and populate <Field.Error>', async () => {
      await render(
        <Form errors={{ foo: 'bar' }}>
          <Field.Root name="foo">
            <Field.Control />
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>,
      );

      expect(screen.getByTestId('error')).toHaveTextContent('bar');
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not mark <Field.Control> as invalid if no error is provided', async () => {
      await render(
        <Form>
          <Field.Root name="foo">
            <Field.Control />
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>,
      );

      expect(screen.queryByTestId('error')).toBe(null);
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    });

    it('focuses asynchronously replaced external errors and clears only the changed own property', async () => {
      function App() {
        const [errors, setErrors] = React.useState<Form.Props['errors']>();

        return (
          <Form
            errors={errors}
            onFormSubmit={() => {
              const nextErrors = Object.create(null) as Record<string, string>;
              nextErrors.first = 'First error';
              nextErrors.second = 'Second error';
              Promise.resolve().then(() => setErrors(nextErrors));
            }}
          >
            <Field.Root name="first">
              <Field.Control data-testid="first" />
              <Field.Error data-testid="first-error" />
            </Field.Root>
            <Field.Root name="second">
              <Field.Control data-testid="second" />
              <Field.Error data-testid="second-error" />
            </Field.Root>
            <button type="submit">Submit</button>
          </Form>
        );
      }

      const { user } = await render(<App />);

      await user.click(screen.getByRole('button', { name: 'Submit' }));
      await waitFor(() => expect(screen.getByTestId('first')).toHaveFocus());
      expect(screen.getByTestId('first-error')).toHaveTextContent('First error');
      expect(screen.getByTestId('second-error')).toHaveTextContent('Second error');

      await user.type(screen.getByTestId('first'), 'a');

      expect(screen.queryByTestId('first-error')).toBe(null);
      expect(screen.getByTestId('second-error')).toHaveTextContent('Second error');
    });

    function App() {
      const [errors, setErrors] = React.useState<Form.Props['errors']>({});

      return (
        <Form
          errors={errors}
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const name = formData.get('name') as string;
            const age = formData.get('age') as string;

            setErrors({
              ...(name === '' && { name: 'Name is required' }),
              ...(age === '' && { age: 'Age is required' }),
            });
          }}
        >
          <Field.Root name="name">
            <Field.Control data-testid="name" />
            <Field.Error data-testid="name-error" />
          </Field.Root>
          <Field.Root name="age">
            <Field.Control data-testid="age" />
            <Field.Error data-testid="age-error" />
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>
      );
    }

    it('focuses the first invalid field only on submit', async () => {
      const { user } = await render(<App />);

      const submit = screen.getByRole('button');
      const name = screen.getByTestId('name');
      const age = screen.getByTestId('age');

      await user.click(submit);

      expect(name).toHaveFocus();

      fireEvent.change(name, { target: { value: 'John' } });

      expect(age).not.toHaveFocus();

      await user.click(submit);

      expect(age).toHaveFocus();

      fireEvent.change(age, { target: { value: '42' } });

      await user.click(submit);

      expect(age).not.toHaveFocus();
    });

    it('does not swap focus immediately on change after two submissions', async () => {
      const { user } = await render(<App />);

      const submit = screen.getByRole('button');
      const name = screen.getByTestId('name');
      const age = screen.getByTestId('age');

      await user.click(submit);

      expect(name).toHaveFocus();

      await user.click(submit);

      fireEvent.change(name, { target: { value: 'John' } });

      expect(age).not.toHaveFocus();
    });

    it('removes errors upon change', async () => {
      await render(<App />);

      const name = screen.getByTestId('name');
      const age = screen.getByTestId('age');

      fireEvent.click(screen.getByText('Submit'));

      expect(screen.queryByTestId('name-error')).not.toBe(null);
      expect(screen.queryByTestId('age-error')).not.toBe(null);

      fireEvent.change(name, { target: { value: 'John' } });
      fireEvent.change(age, { target: { value: '42' } });
      expect(screen.queryByTestId('name-error')).toBe(null);
      expect(screen.queryByTestId('age-error')).toBe(null);
    });

    it('runs field validation on first change after Form error is set', async () => {
      const validateSpy = vi.fn((value: unknown) => {
        if (value === 'abcd') {
          return 'field error';
        }
        return null;
      });

      function Test() {
        const [errors, setErrors] = React.useState<Form.Props['errors']>({});

        return (
          <Form
            errors={errors}
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const name = formData.get('name') as string;

              if (name === 'abcde') {
                setErrors({ name: 'submit error' });
              } else {
                setErrors({});
              }
            }}
          >
            <Field.Root name="name" validate={validateSpy}>
              <Field.Control data-testid="name" />
              <Field.Error data-testid="name-error" />
            </Field.Root>
            <button type="submit">Submit</button>
          </Form>
        );
      }

      const { user } = await render(<Test />);

      const input = screen.getByTestId('name');
      await user.click(input);
      await user.keyboard('abcde');
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      expect(screen.queryByTestId('name-error')).not.toBe(null);
      expect(screen.getByTestId('name-error')).toHaveTextContent('submit error');

      validateSpy.mockClear();

      await user.click(input);
      // value changes from 'abcde' to 'abcd'
      await user.keyboard('{Backspace}');
      expect(validateSpy.mock.calls.length).toBe(1);
      expect(screen.queryByTestId('name-error')).not.toBe(null);
      expect(screen.getByTestId('name-error')).toHaveTextContent('field error');
    });

    it('runs field validation on change when invalid prop is true and validationMode is onChange', async () => {
      const validateSpy = vi.fn(() => 'field error');

      function Test() {
        return (
          <Form errors={{ name: 'server error' }}>
            <Field.Root name="name" invalid validate={validateSpy} validationMode="onChange">
              <Field.Control data-testid="name" />
              <Field.Error data-testid="name-error" />
            </Field.Root>
          </Form>
        );
      }

      const { user } = await render(<Test />);

      const input = screen.getByTestId('name');
      expect(screen.getByTestId('name-error')).toHaveTextContent('server error');

      await user.click(input);
      await user.keyboard('a');

      expect(validateSpy.mock.calls.length).toBe(1);
      expect(screen.getByTestId('name-error')).toHaveTextContent('field error');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not run field validation on change for onBlur mode when invalid prop is true', async () => {
      const validateSpy = vi.fn(() => 'field error');

      function Test() {
        return (
          <Form errors={{ name: 'server error' }}>
            <Field.Root name="name" invalid validate={validateSpy} validationMode="onBlur">
              <Field.Control data-testid="name" />
              <Field.Error data-testid="name-error" />
            </Field.Root>
          </Form>
        );
      }

      const { user } = await render(<Test />);

      const input = screen.getByTestId('name');
      expect(screen.getByTestId('name-error')).toHaveTextContent('server error');

      await user.click(input);
      await user.keyboard('a');
      expect(validateSpy.mock.calls.length).toBe(0);
      expect(screen.queryByTestId('name-error')).toBe(null);

      await user.tab();
      expect(validateSpy.mock.calls.length).toBe(1);
      expect(screen.getByTestId('name-error')).toHaveTextContent('field error');
    });

    it('removes errors for every field that changes within a single commit', async () => {
      const errors = { a: 'A error', b: 'B error', c: 'C error' };

      function MultiChangeApp() {
        const [a, setA] = React.useState(false);
        const [b, setB] = React.useState(false);
        const [c, setC] = React.useState(false);

        return (
          <Form errors={errors}>
            <Field.Root name="a">
              <Switch.Root checked={a} onCheckedChange={setA} />
              <Field.Error data-testid="a-error" />
            </Field.Root>
            <Field.Root name="b">
              <Switch.Root checked={b} onCheckedChange={setB} />
              <Field.Error data-testid="b-error" />
            </Field.Root>
            <Field.Root name="c">
              <Switch.Root checked={c} onCheckedChange={setC} />
              <Field.Error data-testid="c-error" />
            </Field.Root>
            <button
              type="button"
              onClick={() => {
                setA(true);
                setB(true);
              }}
            >
              Change both
            </button>
          </Form>
        );
      }

      await render(<MultiChangeApp />);

      expect(screen.queryByTestId('a-error')).not.toBe(null);
      expect(screen.queryByTestId('b-error')).not.toBe(null);
      expect(screen.queryByTestId('c-error')).not.toBe(null);

      fireEvent.click(screen.getByText('Change both'));

      expect(screen.queryByTestId('a-error')).toBe(null);
      expect(screen.queryByTestId('b-error')).toBe(null);
      expect(screen.queryByTestId('c-error')).not.toBe(null);
    });
  });

  describe('prop: onFormSubmit', () => {
    it('runs when the form is submitted', async () => {
      const submitSpy = vi.fn((formValues, eventDetails) => ({ formValues, eventDetails }));

      function App() {
        return (
          <Form onFormSubmit={submitSpy}>
            <Field.Root name="username">
              <Field.Control defaultValue="alice132" />
            </Field.Root>
            <Field.Root name="quantity">
              <NumberField.Root defaultValue={5}>
                <NumberField.Input />
              </NumberField.Root>
            </Field.Root>
            <button type="submit">submit</button>
          </Form>
        );
      }

      await render(<App />);

      fireEvent.click(screen.getByText('submit'));

      expect(submitSpy.mock.calls.length).toBe(1);
      expect(submitSpy.mock.results.at(-1)?.value.formValues).toEqual({
        username: 'alice132',
        quantity: 5,
      });
      expect(submitSpy.mock.results.at(-1)?.value.eventDetails.event.defaultPrevented).toBe(true);
    });

    it('does not run when the form is invalid', async () => {
      const submitSpy = vi.fn();

      function App() {
        return (
          <Form onFormSubmit={submitSpy}>
            <Field.Root name="username">
              <Field.Control defaultValue="" required />
              <Field.Error data-testid="error" />
            </Field.Root>
            <button type="submit">submit</button>
          </Form>
        );
      }
      await render(<App />);
      expect(screen.queryByTestId('error')).toBe(null);
      fireEvent.click(screen.getByText('submit'));
      expect(submitSpy.mock.calls.length).toBe(0);
      expect(screen.queryByTestId('error')).not.toBe(null);
    });
  });

  it('does not submit when invalid prop remains true even if validate returns null', async () => {
    const submitSpy = vi.fn();
    const validateSpy = vi.fn(() => null);

    const { user } = await render(
      <Form onSubmit={submitSpy}>
        <Field.Root name="name" invalid validate={validateSpy} validationMode="onChange">
          <Field.Control data-testid="name" />
          <Field.Error data-testid="name-error" />
        </Field.Root>
        <button type="submit">submit</button>
      </Form>,
    );

    const input = screen.getByTestId('name');
    await user.click(input);
    await user.keyboard('o');

    expect(validateSpy.mock.calls.length).toBe(1);

    await user.click(screen.getByText('submit'));

    expect(submitSpy.mock.calls.length).toBe(0);
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  describe('prop: noValidate', () => {
    it('should disable native validation if set to true (default)', async () => {
      await render(<Form data-testid="form" />);
      expect(screen.getByTestId('form')).toHaveAttribute('novalidate');
    });

    it('should enable native validation if set to false', async () => {
      await render(<Form noValidate={false} data-testid="form" />);
      expect(screen.getByTestId('form')).not.toHaveAttribute('novalidate');
    });
  });

  describe('prop: actionsRef', () => {
    it('validates the form when the `validate` method is called', async () => {
      function App() {
        const actionsRef = React.useRef<Form.Actions>(null);
        return (
          <div>
            <Form actionsRef={actionsRef}>
              <Field.Root name="username">
                <Field.Control defaultValue="" required />
                <Field.Error data-testid="error" />
              </Field.Root>
              <Field.Root name="quantity" validate={() => 'error'}>
                <NumberField.Root defaultValue={5}>
                  <NumberField.Input />
                </NumberField.Root>
                <Field.Error data-testid="error" />
              </Field.Root>
              <button type="submit">submit</button>
            </Form>
            <button type="button" onClick={() => actionsRef.current?.validate()}>
              validate
            </button>
          </div>
        );
      }

      const { user } = await render(<App />);

      expect(screen.queryByTestId('error')).toBe(null);

      await user.click(screen.getByText('validate'));

      await expect(screen.queryAllByTestId('error').length).toBe(2);
    });

    it('validates a field when the `validate` method is called with the field name', async () => {
      function App() {
        const actionsRef = React.useRef<Form.Actions>(null);
        return (
          <div>
            <Form actionsRef={actionsRef}>
              <Field.Root name="username">
                <Field.Control defaultValue="" required />
                <Field.Error data-testid="error" />
              </Field.Root>
              <Field.Root name="quantity" validate={() => 'number field error'}>
                <NumberField.Root defaultValue={5}>
                  <NumberField.Input />
                </NumberField.Root>
                <Field.Error data-testid="error" />
              </Field.Root>
              <button type="submit">submit</button>
            </Form>
            <button type="button" onClick={() => actionsRef.current?.validate('quantity')}>
              validate
            </button>
          </div>
        );
      }

      const { user } = await render(<App />);

      expect(screen.queryByTestId('error')).toBe(null);

      await user.click(screen.getByText('validate'));

      await expect(screen.queryByTestId('error')).toHaveTextContent('number field error');
    });

    it('targets only the current Strict Mode registration after name, id, and control replacement', async () => {
      const initialValidate = vi.fn(() => null);
      const renamedValidate = vi.fn(() => null);
      const replacementValidate = vi.fn(() => null);

      function App() {
        const actionsRef = React.useRef<Form.Actions>(null);
        const [step, setStep] = React.useState(0);
        const visible = step !== 2;
        const name = step === 0 ? 'initial' : 'current';
        let validate = initialValidate;
        if (step === 1) {
          validate = renamedValidate;
        } else if (step > 1) {
          validate = replacementValidate;
        }

        return (
          <React.Fragment>
            <Form actionsRef={actionsRef}>
              {visible && (
                <Field.Root key={step} name={name} validate={validate}>
                  <Field.Control id={`control-${step}`} />
                </Field.Root>
              )}
            </Form>
            <button type="button" onClick={() => setStep(1)}>
              Rename
            </button>
            <button type="button" onClick={() => setStep(2)}>
              Unmount
            </button>
            <button type="button" onClick={() => setStep(3)}>
              Replace
            </button>
            <button type="button" onClick={() => actionsRef.current?.validate('initial')}>
              Validate initial
            </button>
            <button type="button" onClick={() => actionsRef.current?.validate('current')}>
              Validate current
            </button>
          </React.Fragment>
        );
      }

      const { user } = await render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      );

      await user.click(screen.getByRole('button', { name: 'Rename' }));
      await user.click(screen.getByRole('button', { name: 'Validate initial' }));
      await user.click(screen.getByRole('button', { name: 'Validate current' }));

      expect(initialValidate).not.toHaveBeenCalled();
      expect(renamedValidate).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('button', { name: 'Unmount' }));
      await user.click(screen.getByRole('button', { name: 'Validate current' }));
      expect(renamedValidate).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('button', { name: 'Replace' }));
      await user.click(screen.getByRole('button', { name: 'Validate current' }));

      expect(replacementValidate).toHaveBeenCalledTimes(1);
    });
  });
  describe('native reset', () => {
    async function resetForm() {
      await act(async () => {
        screen.getByTestId<HTMLFormElement>('form').reset();
      });
    }

    function getHiddenInput(name: string) {
      return document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
    }

    // A trusted click lets React commit between the `reset` event and the browser restoring values.
    it.skipIf(isJSDOM)('keeps hidden checked inputs in sync on a reset button click', async () => {
      const { userEvent } = await import('vitest/browser');
      // Canceling keeps the changed state, which the browser's restore must not overwrite.
      const cancelReset = (_: unknown, details: { reason: string; cancel: () => void }) => {
        if (details.reason === 'form-reset') {
          details.cancel();
        }
      };
      await render(
        <form>
          <Switch.Root name="s" defaultChecked onCheckedChange={cancelReset} />
          <RadioGroup name="r" defaultValue="a" onValueChange={cancelReset}>
            <Radio.Root value="a" />
            <Radio.Root value="b" data-testid="b" />
          </RadioGroup>
          <CheckboxGroup defaultValue={['a']} onValueChange={cancelReset}>
            <Checkbox.Root value="a" name="ga" />
            <Checkbox.Root value="b" name="gb" data-testid="gb" />
          </CheckboxGroup>
          <button type="reset">Reset</button>
        </form>,
      );

      fireEvent.click(screen.getByRole('switch'));
      fireEvent.click(screen.getByTestId('b'));
      fireEvent.click(screen.getByTestId('gb'));

      // `act()` would defer React's flush past the reset, hiding the ordering under test.
      const reactGlobals = globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      };
      const actEnvironment = reactGlobals.IS_REACT_ACT_ENVIRONMENT;
      reactGlobals.IS_REACT_ACT_ENVIRONMENT = false;
      try {
        await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
      } finally {
        reactGlobals.IS_REACT_ACT_ENVIRONMENT = actEnvironment;
      }

      const radios = document.querySelectorAll<HTMLInputElement>('input[name="r"]');
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
      expect(getHiddenInput('s').checked).toBe(false);
      expect(screen.getByTestId('b')).toHaveAttribute('aria-checked', 'true');
      expect(radios[0].checked).toBe(false);
      expect(radios[1].checked).toBe(true);
      expect(screen.getByTestId('gb')).toHaveAttribute('aria-checked', 'true');
      expect(getHiddenInput('gb').checked).toBe(true);
    });

    it('Switch', async () => {
      const onCheckedChange = vi.fn();
      await render(
        <form data-testid="form">
          <Field.Root data-testid="field">
            <Switch.Root name="s" onCheckedChange={(v, d) => onCheckedChange(v, d.reason)} />
          </Field.Root>
        </form>,
      );

      fireEvent.click(screen.getByRole('switch'));
      expect(screen.getByTestId('field')).toHaveAttribute('data-dirty');

      await resetForm();

      expect(onCheckedChange).toHaveBeenLastCalledWith(false, 'form-reset');
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
      expect(getHiddenInput('s').checked).toBe(false);
      expect(screen.getByTestId('field')).not.toHaveAttribute('data-dirty');
    });

    it('CheckboxGroup', async () => {
      const onValueChange = vi.fn();
      await render(
        <form data-testid="form">
          <Field.Root data-testid="field">
            <CheckboxGroup
              defaultValue={['a']}
              onValueChange={(v, d) => onValueChange(v, d.reason)}
            >
              <Checkbox.Root value="a" name="a" />
              <Checkbox.Root value="b" name="b" data-testid="b" />
            </CheckboxGroup>
          </Field.Root>
        </form>,
      );

      fireEvent.click(screen.getByTestId('b'));
      expect(screen.getByTestId('field')).toHaveAttribute('data-dirty');

      await resetForm();

      expect(onValueChange).toHaveBeenLastCalledWith(['a'], 'form-reset');
      expect(screen.getByTestId('b')).toHaveAttribute('aria-checked', 'false');
      expect(getHiddenInput('a').checked).toBe(true);
      expect(getHiddenInput('b').checked).toBe(false);
      expect(screen.getByTestId('field')).not.toHaveAttribute('data-dirty');
    });

    it('RadioGroup', async () => {
      const onValueChange = vi.fn();
      await render(
        <form data-testid="form">
          <Field.Root data-testid="field">
            <RadioGroup
              name="r"
              defaultValue="a"
              onValueChange={(v, d) => onValueChange(v, d.reason)}
            >
              <Radio.Root value="a" data-testid="a" />
              <Radio.Root value="b" data-testid="b" />
            </RadioGroup>
          </Field.Root>
        </form>,
      );

      fireEvent.click(screen.getByTestId('b'));
      expect(screen.getByTestId('b')).toHaveAttribute('aria-checked', 'true');

      await resetForm();

      const [inputA, inputB] = Array.from(
        document.querySelectorAll<HTMLInputElement>('input[name="r"]'),
      );
      expect(onValueChange).toHaveBeenLastCalledWith('a', 'form-reset');
      expect(screen.getByTestId('a')).toHaveAttribute('aria-checked', 'true');
      expect(inputA.checked).toBe(true);
      expect(inputB.checked).toBe(false);
      expect(screen.getByTestId('field')).not.toHaveAttribute('data-dirty');
    });

    it('Select', async () => {
      const onValueChange = vi.fn();
      function App() {
        const [value, setValue] = React.useState('a');
        return (
          <form data-testid="form">
            <Field.Root data-testid="field">
              <Select.Root
                name="s"
                value={value}
                onValueChange={(v, d) => {
                  onValueChange(v, d.reason);
                  setValue(v as string);
                }}
              >
                <Select.Trigger />
              </Select.Root>
            </Field.Root>
            <button type="button" onClick={() => setValue('b')}>
              Change
            </button>
          </form>
        );
      }
      await render(<App />);

      fireEvent.click(screen.getByRole('button', { name: 'Change' }));
      expect(getHiddenInput('s').value).toBe('b');

      await resetForm();

      expect(onValueChange).toHaveBeenLastCalledWith('a', 'form-reset');
      expect(getHiddenInput('s').value).toBe('a');
    });

    it('Combobox', async () => {
      const onValueChange = vi.fn();
      function App() {
        const [value, setValue] = React.useState<string | null>('a');
        return (
          <form data-testid="form">
            <Combobox.Root
              name="c"
              items={['a', 'b']}
              value={value}
              onValueChange={(v, d) => {
                onValueChange(v, d.reason);
                setValue(v);
              }}
            >
              <Combobox.Input data-testid="input" />
            </Combobox.Root>
            <button type="button" onClick={() => setValue('b')}>
              Change
            </button>
          </form>
        );
      }
      await render(<App />);

      fireEvent.click(screen.getByRole('button', { name: 'Change' }));
      expect(getHiddenInput('c').value).toBe('b');

      await resetForm();

      expect(onValueChange).toHaveBeenLastCalledWith('a', 'form-reset');
      expect(getHiddenInput('c').value).toBe('a');
    });

    it('Autocomplete', async () => {
      const onValueChange = vi.fn();
      await render(
        <form data-testid="form">
          <Autocomplete.Root
            items={['apple']}
            defaultValue="ap"
            onValueChange={(v, d) => onValueChange(v, d.reason)}
          >
            <Autocomplete.Input data-testid="input" />
          </Autocomplete.Root>
        </form>,
      );

      const input = screen.getByTestId<HTMLInputElement>('input');
      fireEvent.change(input, { target: { value: 'apple' } });
      expect(input.value).toBe('apple');

      await resetForm();

      expect(onValueChange).toHaveBeenLastCalledWith('ap', 'form-reset');
      expect(input.value).toBe('ap');
    });

    it('Autocomplete restores a controlled value to its mount value', async () => {
      const onValueChange = vi.fn();
      function App() {
        const [value, setValue] = React.useState('ap');
        return (
          <form data-testid="form">
            <Autocomplete.Root
              items={['apple']}
              value={value}
              onValueChange={(v, d) => {
                onValueChange(v, d.reason);
                setValue(v);
              }}
            >
              <Autocomplete.Input data-testid="input" />
            </Autocomplete.Root>
          </form>
        );
      }
      await render(<App />);

      const input = screen.getByTestId<HTMLInputElement>('input');
      fireEvent.change(input, { target: { value: 'apple' } });

      await resetForm();

      expect(onValueChange).toHaveBeenLastCalledWith('ap', 'form-reset');
      expect(input.value).toBe('ap');
    });

    it('Select does not report a reset when the value is unchanged', async () => {
      const onValueChange = vi.fn();
      function App() {
        const [value, setValue] = React.useState(['a']);
        return (
          <form data-testid="form">
            <Select.Root multiple value={value} onValueChange={onValueChange}>
              <Select.Trigger />
            </Select.Root>
            <button type="button" onClick={() => setValue(['a'])}>
              Change
            </button>
          </form>
        );
      }
      await render(<App />);

      fireEvent.click(screen.getByRole('button', { name: 'Change' }));
      await resetForm();

      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('resets a checkbox without a value inside a CheckboxGroup', async () => {
      await render(
        <form data-testid="form">
          <CheckboxGroup defaultValue={[]}>
            <Checkbox.Root data-testid="agree" />
          </CheckboxGroup>
        </form>,
      );

      fireEvent.click(screen.getByTestId('agree'));
      expect(screen.getByTestId('agree')).toHaveAttribute('aria-checked', 'true');

      await resetForm();

      expect(screen.getByTestId('agree')).toHaveAttribute('aria-checked', 'false');
    });

    it('NumberField does not commit the restored value on a later blur', async () => {
      const onValueCommitted = vi.fn();
      await render(
        <form data-testid="form">
          <NumberField.Root defaultValue={1} onValueCommitted={onValueCommitted}>
            <NumberField.Input data-testid="input" />
            <NumberField.Increment data-testid="increment" />
          </NumberField.Root>
        </form>,
      );

      fireEvent.click(screen.getByTestId('increment'));
      await resetForm();
      onValueCommitted.mockClear();

      const input = screen.getByTestId('input');
      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(onValueCommitted).not.toHaveBeenCalled();
    });

    it('NumberField restores an out-of-range initial value', async () => {
      await render(
        <form data-testid="form">
          <NumberField.Root defaultValue={150} max={100} allowOutOfRange>
            <NumberField.Input data-testid="input" />
            <NumberField.Decrement data-testid="decrement" />
          </NumberField.Root>
        </form>,
      );

      const input = screen.getByTestId<HTMLInputElement>('input');
      fireEvent.click(screen.getByTestId('decrement'));
      expect(input.value).not.toBe('150');

      await resetForm();

      expect(input.value).toBe('150');
    });

    it('NumberField', async () => {
      const onValueChange = vi.fn();
      await render(
        <form data-testid="form">
          <Field.Root data-testid="field">
            <NumberField.Root
              name="n"
              defaultValue={1}
              onValueChange={(v, d) => onValueChange(v, d.reason)}
            >
              <NumberField.Input data-testid="input" />
              <NumberField.Increment data-testid="increment" />
            </NumberField.Root>
          </Field.Root>
        </form>,
      );

      fireEvent.click(screen.getByTestId('increment'));
      expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('2');

      await resetForm();

      expect(onValueChange).toHaveBeenLastCalledWith(1, 'form-reset');
      expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('1');
      expect(getHiddenInput('n').value).toBe('1');
      expect(screen.getByTestId('field')).not.toHaveAttribute('data-dirty');
    });

    it('Slider', async () => {
      const onValueChange = vi.fn();
      await render(
        <form data-testid="form">
          <Field.Root data-testid="field">
            <Slider.Root
              name="sl"
              defaultValue={10}
              onValueChange={(v, d) => onValueChange(v, d.reason, d.activeThumbIndex)}
            >
              <Slider.Control>
                <Slider.Thumb />
              </Slider.Control>
            </Slider.Root>
          </Field.Root>
        </form>,
      );

      const thumbInput = screen.getByRole<HTMLInputElement>('slider');
      await act(async () => {
        thumbInput.focus();
      });
      fireEvent.keyDown(thumbInput, { key: 'ArrowRight' });
      expect(thumbInput.value).toBe('11');

      await resetForm();

      expect(onValueChange).toHaveBeenLastCalledWith(10, 'form-reset', -1);
      expect(thumbInput.value).toBe('10');
      expect(screen.getByTestId('field')).not.toHaveAttribute('data-dirty');
    });

    it('OTPField', async () => {
      const onValueChange = vi.fn();
      function App() {
        const [value, setValue] = React.useState('12');
        return (
          <form data-testid="form">
            <OTPField.Root
              name="otp"
              length={4}
              value={value}
              onValueChange={(v, d) => {
                onValueChange(v, d.reason);
                setValue(v);
              }}
            >
              <OTPField.Input />
              <OTPField.Input />
              <OTPField.Input />
              <OTPField.Input />
            </OTPField.Root>
            <button type="button" onClick={() => setValue('1234')}>
              Change
            </button>
          </form>
        );
      }
      await render(<App />);

      fireEvent.click(screen.getByRole('button', { name: 'Change' }));
      expect(getHiddenInput('otp').value).toBe('1234');

      await resetForm();

      expect(onValueChange).toHaveBeenLastCalledWith('12', 'form-reset');
      expect(getHiddenInput('otp').value).toBe('12');
    });
  });
});
