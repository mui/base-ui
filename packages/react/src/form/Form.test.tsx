import * as React from 'react';
import { Form } from '@base-ui-components/react/form';
import { Field } from '@base-ui-components/react/field';
import { expect } from 'chai';
import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { describeConformance } from '../../test/describeConformance';

describe('<Form />', () => {
  const { render } = createRenderer();

  describeConformance(<Form />, () => ({
    refInstanceof: window.HTMLFormElement,
    render,
  }));

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
