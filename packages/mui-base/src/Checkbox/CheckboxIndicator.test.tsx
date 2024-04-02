import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '@mui/internal-test-utils';
import { describeConformance } from '../../test/describeConformance';
import { Checkbox } from '.';
import { CheckboxContext } from './CheckboxContext';

const testContext = {
  checked: true,
  disabled: false,
  readOnly: false,
  required: false,
  indeterminate: false,
};

describe('<Checkbox.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Checkbox.Indicator />, () => ({
    inheritComponent: 'span',
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <CheckboxContext.Provider value={testContext}>{node}</CheckboxContext.Provider>,
      );
    },
    skip: ['reactTestRenderer'],
  }));

  it('should not render indicator by default', () => {
    const { container } = render(
      <Checkbox>
        <Checkbox.Indicator />
      </Checkbox>,
    );
    const indicator = container.querySelector('span');
    expect(indicator).to.equal(null);
  });

  it('should render indicator when checked', () => {
    const { container } = render(
      <Checkbox checked>
        <Checkbox.Indicator />
      </Checkbox>,
    );
    const indicator = container.querySelector('span');
    expect(indicator).not.to.equal(null);
  });

  it('should spread extra props', () => {
    const { container } = render(
      <Checkbox defaultChecked>
        <Checkbox.Indicator data-extra-prop="Lorem ipsum" />
      </Checkbox>,
    );
    const indicator = container.querySelector('span');
    expect(indicator).to.have.attribute('data-extra-prop', 'Lorem ipsum');
  });

  describe('keepMounted prop', () => {
    it('should keep indicator mounted when unchecked', () => {
      const { container } = render(
        <Checkbox>
          <Checkbox.Indicator keepMounted />
        </Checkbox>,
      );
      const indicator = container.querySelector('span');
      expect(indicator).not.to.equal(null);
    });

    it('should keep indicator mounted when checked', () => {
      const { container } = render(
        <Checkbox checked>
          <Checkbox.Indicator keepMounted />
        </Checkbox>,
      );
      const indicator = container.querySelector('span');
      expect(indicator).not.to.equal(null);
    });

    it('should keep indicator mounted when indeterminate', () => {
      const { container } = render(
        <Checkbox indeterminate>
          <Checkbox.Indicator keepMounted />
        </Checkbox>,
      );
      const indicator = container.querySelector('span');
      expect(indicator).not.to.equal(null);
    });
  });
});
