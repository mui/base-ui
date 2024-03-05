import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '@mui/internal-test-utils';
import { FormField, useFormFieldContext } from '@mui/base/FormField';

describe('FormField', () => {
  const { render } = createRenderer();

  describe('initial state', () => {
    it('has undefined value', () => {
      function TestComponent() {
        const context = useFormFieldContext();
        return <input value={context!.value as string} />;
      }

      const { getByRole } = render(
        <FormField>
          <TestComponent />
        </FormField>,
      );

      expect(getByRole('textbox')).to.have.property('value', '');
    });

    it('dirty, disabled, focused, invalid, required, touched are initially false', () => {
      function TestComponent() {
        const context = useFormFieldContext();

        return (
          <input
            data-dirty={context!.dirty}
            data-focused={context!.focused}
            data-invalid={context!.invalid}
            data-touched={context!.touched}
            disabled={context!.disabled}
            required={context!.required}
          />
        );
      }

      const { getByRole } = render(
        <FormField>
          <TestComponent />
        </FormField>,
      );

      expect(getByRole('textbox')).to.include({
        disabled: false,
        required: false,
      });

      expect(getByRole('textbox').dataset).to.include({
        dirty: 'false',
        focused: 'false',
        invalid: 'false',
        touched: 'false',
      });
    });
  });

  describe('prop: name', () => {
    it('name attribute should propagate via the context', () => {
      function TestComponent() {
        const context = useFormFieldContext();
        return <input name={context!.name} />;
      }

      const { getByRole } = render(
        <FormField name="myFieldName">
          <TestComponent />
        </FormField>,
      );

      expect(getByRole('textbox')).to.have.property('name', 'myFieldName');
    });
  });

  describe('prop: value', () => {
    it('value should propagate via the context', () => {
      function TestComponent() {
        const context = useFormFieldContext();
        return <input value={context!.value as string} onChange={() => {}} />;
      }

      const { getByRole } = render(
        <FormField value="test@email.com">
          <TestComponent />
        </FormField>,
      );

      expect(getByRole('textbox')).to.have.value('test@email.com');
    });
  });

  describe('prop: defaultValue', () => {
    it('defaultValue should propagate via the context as context.value', () => {
      function TestComponent() {
        const context = useFormFieldContext();
        return <input value={context!.value as string} onChange={() => {}} />;
      }

      const { getByRole } = render(
        <FormField defaultValue="Netscape Navigator">
          <TestComponent />
        </FormField>,
      );

      expect(getByRole('textbox')).to.have.value('Netscape Navigator');
    });
  });

  describe('prop: disabled', () => {
    it('disabled state should propagate via the context', () => {
      function TestComponent() {
        const context = useFormFieldContext();
        return <input disabled={context!.disabled} />;
      }

      const { getByRole } = render(
        <FormField disabled>
          <TestComponent />
        </FormField>,
      );

      expect(getByRole('textbox')).to.have.attribute('disabled');
    });
  });

  describe('prop: required', () => {
    it('required attribute should propagate via the context', () => {
      function TestComponent() {
        const context = useFormFieldContext();
        return <input required={context!.required} />;
      }

      const { getByRole } = render(
        <FormField required>
          <TestComponent />
        </FormField>,
      );

      expect(getByRole('textbox')).to.have.attribute('required');
    });
  });

  describe('prop: focused', () => {
    it('focused state should propagate via the context', () => {
      function TestComponent() {
        const context = useFormFieldContext();
        return <input data-focused={context!.focused} />;
      }

      const { getByRole } = render(
        <FormField focused>
          <TestComponent />
        </FormField>,
      );

      expect(getByRole('textbox').getAttribute('data-focused')).to.equal('true');
    });
  });

  describe('prop: invalid', () => {
    it('invalid state should propagate via the context', () => {
      function TestComponent() {
        const context = useFormFieldContext();
        return <input data-invalid={context!.invalid} />;
      }

      const { getByRole } = render(
        <FormField invalid>
          <TestComponent />
        </FormField>,
      );

      expect(getByRole('textbox').getAttribute('data-invalid')).to.equal('true');
    });
  });

  describe('prop: touched', () => {
    it('touched state should propagate via the context', () => {
      function TestComponent() {
        const context = useFormFieldContext();
        return <input data-touched={context!.touched} />;
      }

      const { getByRole } = render(
        <FormField touched>
          <TestComponent />
        </FormField>,
      );

      expect(getByRole('textbox').getAttribute('data-touched')).to.equal('true');
    });
  });

  describe('prop: dirty', () => {
    it('dirty state should propagate via the context', () => {
      function TestComponent() {
        const context = useFormFieldContext();
        return <input data-dirty={context!.dirty} />;
      }

      const { getByRole } = render(
        <FormField dirty>
          <TestComponent />
        </FormField>,
      );

      expect(getByRole('textbox').getAttribute('data-dirty')).to.equal('true');
    });
  });
});
