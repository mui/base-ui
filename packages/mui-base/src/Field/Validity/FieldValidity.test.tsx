import * as React from 'react';
import { act, createRenderer, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import * as Field from '@base_ui/react/Field';

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

    act(() => {
      input.focus();
      input.value = 'test';
      input.blur();
    });

    const [data] = handleValidity.args[4];

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

    act(() => {
      input.focus();
      input.blur();
    });

    expect(handleValidity.args[4][0].error).to.equal('error');
    expect(handleValidity.args[4][0].errors).to.deep.equal(['error']);
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

    act(() => {
      input.focus();
      input.blur();
    });

    expect(handleValidity.args[4][0].error).to.equal('1');
    expect(handleValidity.args[4][0].errors).to.deep.equal(['1', '2']);
  });
});
