import * as React from 'react';
import { Form } from '@base-ui/react/form';
import { Field } from '@base-ui/react/field';
import { NumberField } from '@base-ui/react/number-field';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { describeConformance } from '../../test/describeConformance';

describe('<Form />', () => {
  const { render } = createRenderer();

  describeConformance(<Form />, () => ({
    refInstanceof: window.HTMLFormElement,
    render,
  }));

  it('does not submit if there are errors', async () => {
    const onSubmit = spy();

    const { user } = render(
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

    expect(screen.getByTestId('error')).not.to.equal(null);
    expect(onSubmit.called).to.equal(false);
  });

  it('unmounted fields should be removed from the form', async () => {
    const submitSpy = spy((event) => event.preventDefault());
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
    expect(submitSpy.callCount).to.equal(0);
    expect(screen.getByTestId('email')).to.have.attribute('aria-invalid', 'true');

    await user.click(screen.getByRole('checkbox'));
    await user.click(submit);
    expect(submitSpy.callCount).to.equal(1);
  });

  describe('prop: errors', () => {
    it('should mark <Field.Control> as invalid and populate <Field.Error>', () => {
      render(
        <Form errors={{ foo: 'bar' }}>
          <Field.Root name="foo">
            <Field.Control />
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>,
      );

      expect(screen.getByTestId('error')).to.have.text('bar');
      expect(screen.getByRole('textbox')).to.have.attribute('aria-invalid', 'true');
    });

    it('should not mark <Field.Control> as invalid if no error is provided', () => {
      render(
        <Form>
          <Field.Root name="foo">
            <Field.Control />
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>,
      );

      expect(screen.queryByTestId('error')).to.equal(null);
      expect(screen.getByRole('textbox')).not.to.have.attribute('aria-invalid');
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
      const { user } = render(<App />);

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
      const { user } = render(<App />);

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
      render(<App />);

      const name = screen.getByTestId('name');
      const age = screen.getByTestId('age');

      fireEvent.click(screen.getByText('Submit'));

      expect(screen.queryByTestId('name-error')).to.not.equal(null);
      expect(screen.queryByTestId('age-error')).to.not.equal(null);

      fireEvent.change(name, { target: { value: 'John' } });
      fireEvent.change(age, { target: { value: '42' } });
      expect(screen.queryByTestId('name-error')).to.equal(null);
      expect(screen.queryByTestId('age-error')).to.equal(null);
    });
  });

  describe('prop: onFormSubmit', () => {
    it('runs when the form is submitted', async () => {
      const submitSpy = spy((formValues, eventDetails) => ({ formValues, eventDetails }));

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

      render(<App />);

      fireEvent.click(screen.getByText('submit'));

      expect(submitSpy.callCount).to.equal(1);
      expect(submitSpy.lastCall.returnValue.formValues).to.deep.equal({
        username: 'alice132',
        quantity: 5,
      });
      expect(submitSpy.lastCall.returnValue.eventDetails.event.defaultPrevented).to.equal(true);
    });

    it('does not run when the form is invalid', async () => {
      const submitSpy = spy();

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
      render(<App />);
      expect(screen.queryByTestId('error')).to.equal(null);
      fireEvent.click(screen.getByText('submit'));
      expect(submitSpy.callCount).to.equal(0);
      expect(screen.queryByTestId('error')).to.not.equal(null);
    });
  });

  describe('prop: noValidate', () => {
    it('should disable native validation if set to true (default)', () => {
      render(<Form data-testid="form" />);
      expect(screen.getByTestId('form')).to.have.attribute('novalidate');
    });

    it('should enable native validation if set to false', () => {
      render(<Form noValidate={false} data-testid="form" />);
      expect(screen.getByTestId('form')).not.to.have.attribute('novalidate');
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

      expect(screen.queryByTestId('error')).to.equal(null);

      await user.click(screen.getByText('validate'));

      await expect(screen.queryAllByTestId('error').length).to.equal(2);
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

      expect(screen.queryByTestId('error')).to.equal(null);

      await user.click(screen.getByText('validate'));

      await expect(screen.queryByTestId('error')).to.have.text('number field error');
    });
  });
});
