import * as React from 'react';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import * as Field from '@base_ui/react/Field';
import { describeConformance } from '../../../test/describeConformance';

describe('<Field.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Root />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('prop: disabled', () => {
    it('should add data-disabled style hook to all components', () => {
      render(
        <Field.Root disabled data-testid="field">
          <Field.Control data-testid="control" />
          <Field.Label data-testid="label" />
          <Field.Message data-testid="message" />
        </Field.Root>,
      );

      const field = screen.getByTestId('field');
      const control = screen.getByTestId('control');
      const label = screen.getByTestId('label');
      const message = screen.getByTestId('message');

      expect(field).to.have.attribute('data-disabled', 'true');
      expect(control).to.have.attribute('data-disabled', 'true');
      expect(label).to.have.attribute('data-disabled', 'true');
      expect(message).to.have.attribute('data-disabled', 'true');
    });
  });
});
