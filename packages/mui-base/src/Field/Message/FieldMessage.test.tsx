import * as React from 'react';
import { act, createRenderer, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import * as Field from '@base_ui/react/Field';
import { describeConformance } from '../../../test/describeConformance';

describe('<Field.Message />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Message />, () => ({
    inheritComponent: 'span',
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<Field.Root>{node}</Field.Root>);
    },
  }));

  it('should set aria-describedby on the control automatically', () => {
    render(
      <Field.Root>
        <Field.Control />
        <Field.Message>Message</Field.Message>
      </Field.Root>,
    );

    expect(screen.getByRole('textbox')).to.have.attribute(
      'aria-describedby',
      screen.getByText('Message').id,
    );
  });

  describe('prop: show', () => {
    it('should only render when `show` matches constraint validation', () => {
      render(
        <Field.Root>
          <Field.Control required />
          <Field.Message show="valueMissing">Message</Field.Message>
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
          <Field.Message show="customError">Message</Field.Message>
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
});
