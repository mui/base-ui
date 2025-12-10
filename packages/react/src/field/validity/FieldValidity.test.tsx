import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';

describe('<Field.Validity />', () => {
  const { render } = createRenderer();

  describe('validationMode=onSubmit', () => {
    it('should pass validity data', () => {
      const handleValidity = spy();

      render(
        <Form>
          <Field.Root>
            <Field.Control required />
            <Field.Validity>{handleValidity}</Field.Validity>
          </Field.Root>
          <button type="submit">submit</button>
        </Form>,
      );

      const input = screen.getByRole<HTMLInputElement>('textbox');

      expect(handleValidity.lastCall.args[0].validity.valid).to.equal(null);

      fireEvent.click(screen.getByText('submit'));

      expect(handleValidity.lastCall.args[0].validity.valid).to.equal(false);
      expect(handleValidity.lastCall.args[0].validity.valueMissing).to.equal(true);

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'test' } });

      expect(handleValidity.lastCall.args[0].value).to.equal('test');
      expect(handleValidity.lastCall.args[0].validity.valid).to.equal(true);
      expect(handleValidity.lastCall.args[0].validity.valueMissing).to.equal(false);
    });
  });

  describe('validationMode=onBlur', () => {
    it('should pass validity data', () => {
      const handleValidity = spy();

      render(
        <Field.Root validationMode="onBlur">
          <Field.Control required />
          <Field.Validity>{handleValidity}</Field.Validity>
        </Field.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('textbox');

      expect(handleValidity.lastCall.args[0].validity.valid).to.equal(null);

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.blur(input);

      expect(handleValidity.lastCall.args[0].value).to.equal('test');
      expect(handleValidity.lastCall.args[0].validity.valid).to.equal(true);
      expect(handleValidity.lastCall.args[0].validity.valueMissing).to.equal(false);
    });

    it('should correctly pass errors when validate function returns a string', () => {
      const handleValidity = spy();

      render(
        <Field.Root validationMode="onBlur" validate={() => 'error'}>
          <Field.Control />
          <Field.Validity>{handleValidity}</Field.Validity>
        </Field.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('textbox');

      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(handleValidity.lastCall.args[0].error).to.equal('error');
      expect(handleValidity.lastCall.args[0].errors).to.deep.equal(['error']);
    });

    it('should correctly pass errors when validate function returns an array of strings', () => {
      const handleValidity = spy();

      render(
        <Field.Root validationMode="onBlur" validate={() => ['1', '2']}>
          <Field.Control />
          <Field.Validity>{handleValidity}</Field.Validity>
        </Field.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('textbox');

      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(handleValidity.lastCall.args[0].error).to.equal('1');
      expect(handleValidity.lastCall.args[0].errors).to.deep.equal(['1', '2']);
    });
  });
});
