import * as React from 'react';
import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { expect } from 'vitest';
import { spy } from 'sinon';
import { Field } from '@base-ui-components/react/field';

describe('<Field.Validity />', () => {
  const { render } = createRenderer();

  it('should pass validity data', () => {
    const handleValidity = spy();

    render(
      <Field.Root>
        <Field.Control required />
        <Field.Validity>{handleValidity}</Field.Validity>
      </Field.Root>,
    );

    const input = screen.getByRole<HTMLInputElement>('textbox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.blur(input);

    const [data] = handleValidity.lastCall.args;

    expect(data.value).to.equal('test');
    expect(data.validity.valueMissing).to.equal(false);
  });

  it('should correctly pass errors when validate function returns a string', () => {
    const handleValidity = spy();

    render(
      <Field.Root validate={() => 'error'}>
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
      <Field.Root validate={() => ['1', '2']}>
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
