import * as React from 'react';
import * as Form from '@base_ui/react/Form';
import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { describeConformance } from '../../../test/describeConformance';

describe('<Form.Submit />', () => {
  const { render } = createRenderer();

  describeConformance(<Form.Submit />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render,
  }));

  describe('prop: disabled', () => {
    it('should replace the native `disabled` attribute', () => {
      const handleSubmit = spy();

      render(
        <Form.Root onSubmit={handleSubmit}>
          <Form.Submit disabled />
        </Form.Root>,
      );

      expect(screen.getByRole('button')).not.to.have.attribute('disabled');
      expect(screen.getByRole('button')).to.have.attribute('aria-disabled', 'true');

      fireEvent.click(screen.getByRole('button'));

      expect(handleSubmit.called).to.equal(false);
    });
  });
});
