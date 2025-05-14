import * as React from 'react';
import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { Field } from '@base-ui-components/react/field';
import { describeConformance } from '../../../test/describeConformance';

describe('<Field.Error />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Error match />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Field.Root invalid>{node}</Field.Root>);
    },
  }));

  it('should set aria-describedby on the control automatically', () => {
    render(
      <Field.Root invalid>
        <Field.Control />
        <Field.Error match>Message</Field.Error>
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

    const input = screen.getByRole<HTMLInputElement>('textbox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(screen.queryByText('Message')).not.to.equal(null);
  });

  describe('prop: match', () => {
    it('should only render when `match` matches constraint validation', () => {
      render(
        <Field.Root>
          <Field.Control required />
          <Field.Error match="valueMissing">Message</Field.Error>
        </Field.Root>,
      );

      expect(screen.queryByText('Message')).to.equal(null);

      const input = screen.getByRole<HTMLInputElement>('textbox');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      expect(screen.queryByText('Message')).not.to.equal(null);
    });

    it('should show custom errors', () => {
      render(
        <Field.Root validate={() => 'error'}>
          <Field.Control />
          <Field.Error match="customError">Message</Field.Error>
        </Field.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('textbox');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      expect(screen.queryByText('Message')).not.to.equal(null);
    });

    it('always renders the error message when `match` is true', () => {
      render(
        <Field.Root>
          <Field.Control required />
          <Field.Error match>Message</Field.Error>
        </Field.Root>,
      );

      expect(screen.queryByText('Message')).not.to.equal(null);
    });
  });
});
