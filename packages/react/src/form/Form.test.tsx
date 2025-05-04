import * as React from 'react';
import { Form } from '@base-ui-components/react/form';
import { Field } from '@base-ui-components/react/field';
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

  describe('prop: errors', () => {
    function App() {
      const [errors, setErrors] = React.useState<Form.Props['errors']>({
        foo: 'bar',
      });

      return (
        <Form
          errors={errors}
          onClearErrors={setErrors}
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
          <button>Submit</button>
        </Form>
      );
    }

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

      fireEvent.change(name, { target: { value: 'John' } });
      fireEvent.change(age, { target: { value: '42' } });

      expect(screen.queryByTestId('name-error')).to.equal(null);
      expect(screen.queryByTestId('age-error')).to.equal(null);
    });
  });

  describe('prop: onClearErrors', () => {
    it('should clear errors if no matching name keys exist', () => {
      function App() {
        const [errors, setErrors] = React.useState<Form.Props['errors']>({
          foo: 'bar',
        });
        return (
          <Form errors={errors} onClearErrors={setErrors}>
            <Field.Root name="foo">
              <Field.Control />
              <Field.Error data-testid="error" />
            </Field.Root>
          </Form>
        );
      }

      render(<App />);

      expect(screen.getByTestId('error')).to.have.text('bar');
      expect(screen.getByRole('textbox')).to.have.attribute('aria-invalid', 'true');

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'baz' } });

      expect(screen.queryByTestId('error')).to.equal(null);
      expect(screen.getByRole('textbox')).not.to.have.attribute('aria-invalid');
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
});
