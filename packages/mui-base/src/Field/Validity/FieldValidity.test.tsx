import * as React from 'react';
import { act, createRenderer, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import * as Field from '@base_ui/react/Field';

describe('<Field.Validity />', () => {
  const { render } = createRenderer();

  it('should pass validity data and ownerState', () => {
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

    const [data, ownerState] = handleValidity.args[4];

    expect(data.value).to.equal('test');
    expect(data.validity.valueMissing).to.equal(false);
    expect(ownerState).to.deep.equal({ disabled: false });
  });
});
