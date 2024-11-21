import * as React from 'react';
import { Form } from '@base-ui-components/react/Form';
import { Field } from '@base-ui-components/react/Field';
import { expect } from 'chai';
import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { describeConformance } from '../../../test/describeConformance';

describe('<Form.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Form.Root />, () => ({
    refInstanceof: window.HTMLFormElement,
    render,
  }));

  describe('prop: errors', () => {
    it('should mark <Field.Control> as invalid and populate <Field.Error>', () => {
      render(
        <Form.Root errors={{ foo: 'bar' }}>
          <Field.Root name="foo">
            <Field.Control />
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form.Root>,
      );

      expect(screen.getByTestId('error')).to.have.text('bar');
      expect(screen.getByRole('textbox')).to.have.attribute('aria-invalid', 'true');
    });

    it('should not mark <Field.Control> as invalid if no error is provided', () => {
      render(
        <Form.Root>
          <Field.Root name="foo">
            <Field.Control />
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form.Root>,
      );

      expect(screen.queryByTestId('error')).to.equal(null);
      expect(screen.getByRole('textbox')).not.to.have.attribute('aria-invalid');
    });
  });

  describe('prop: onClearErrors', () => {
    it('should clear errors if no matching name keys exist', () => {
      function App() {
        const [errors, setErrors] = React.useState<Form.Root.Props['errors']>({
          foo: 'bar',
        });

        return (
          <Form.Root errors={errors} onClearErrors={setErrors}>
            <Field.Root name="foo">
              <Field.Control />
              <Field.Error data-testid="error" />
            </Field.Root>
          </Form.Root>
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
      render(<Form.Root data-testid="form" />);
      expect(screen.getByTestId('form')).to.have.attribute('novalidate');
    });

    it('should enable native validation if set to false', () => {
      render(<Form.Root noValidate={false} data-testid="form" />);
      expect(screen.getByTestId('form')).not.to.have.attribute('novalidate');
    });
  });
});
