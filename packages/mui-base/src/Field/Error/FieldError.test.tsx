import * as React from 'react';
import { act, createRenderer, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import * as Field from '@base_ui/react/Field';
import { describeConformance } from '../../../test/describeConformance';

describe('<Field.Error />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Error forceShow />, () => ({
    inheritComponent: 'span',
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<Field.Root invalid>{node}</Field.Root>);
    },
  }));

  it('should set aria-describedby on the control automatically', () => {
    render(
      <Field.Root invalid>
        <Field.Control />
        <Field.Error forceShow>Message</Field.Error>
      </Field.Root>,
    );

    expect(screen.getByRole('textbox')).to.have.attribute(
      'aria-describedby',
      screen.getByText('Message').id,
    );
  });

  it('should show error messages by default', () => {
    render(
      <Field.Root>
        <Field.Control required />
        <Field.Error>Message</Field.Error>
      </Field.Root>,
    );

    expect(screen.queryByText('Message')).to.equal(null);

    act(() => {
      screen.getByRole('textbox').focus();
      screen.getByRole('textbox').blur();
    });

    expect(screen.queryByText('Message')).not.to.equal(null);
  });

  describe('prop: show', () => {
    it('should only render when `show` matches constraint validation', () => {
      render(
        <Field.Root>
          <Field.Control required />
          <Field.Error show="valueMissing">Message</Field.Error>
        </Field.Root>,
      );

      expect(screen.queryByText('Message')).to.equal(null);

      act(() => {
        screen.getByRole('textbox').focus();
        screen.getByRole('textbox').blur();
      });

      expect(screen.queryByText('Message')).not.to.equal(null);
    });

    it('should show custom errors', () => {
      render(
        <Field.Root validate={() => 'error'}>
          <Field.Control />
          <Field.Error show="customError">Message</Field.Error>
        </Field.Root>,
      );

      act(() => {
        const textbox = screen.getByRole<HTMLInputElement>('textbox');
        textbox.focus();
        textbox.blur();
      });

      expect(screen.queryByText('Message')).not.to.equal(null);
    });
  });

  describe('prop: forceShow', () => {
    it('should always render the error message', () => {
      render(
        <Field.Root>
          <Field.Control required />
          <Field.Error forceShow>Message</Field.Error>
        </Field.Root>,
      );

      expect(screen.queryByText('Message')).not.to.equal(null);
    });
  });
});
