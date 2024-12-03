import * as React from 'react';
import { expect } from 'chai';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { createRenderer, describeConformance } from '#test-utils';
import { CheckboxRootContext } from '../root/CheckboxRootContext';

const testContext = {
  checked: true,
  disabled: false,
  readOnly: false,
  required: false,
  indeterminate: false,
  dirty: false,
  touched: false,
  valid: null,
};

describe('<Checkbox.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Checkbox.Indicator />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <CheckboxRootContext.Provider value={testContext}>{node}</CheckboxRootContext.Provider>,
      );
    },
  }));

  it('should not render indicator by default', async () => {
    const { container } = await render(
      <Checkbox.Root>
        <Checkbox.Indicator animated={false} />
      </Checkbox.Root>,
    );
    const indicator = container.querySelector('span');
    expect(indicator).to.equal(null);
  });

  it('should render indicator when checked', async () => {
    const { container } = await render(
      <Checkbox.Root checked>
        <Checkbox.Indicator animated={false} />
      </Checkbox.Root>,
    );
    const indicator = container.querySelector('span');
    expect(indicator).not.to.equal(null);
  });

  it('should spread extra props', async () => {
    const { container } = await render(
      <Checkbox.Root defaultChecked>
        <Checkbox.Indicator data-extra-prop="Lorem ipsum" animated={false} />
      </Checkbox.Root>,
    );
    const indicator = container.querySelector('span');
    expect(indicator).to.have.attribute('data-extra-prop', 'Lorem ipsum');
  });

  describe('keepMounted prop', () => {
    it('should keep indicator mounted when unchecked', async () => {
      const { container } = await render(
        <Checkbox.Root>
          <Checkbox.Indicator keepMounted animated={false} />
        </Checkbox.Root>,
      );
      const indicator = container.querySelector('span');
      expect(indicator).not.to.equal(null);
      expect(indicator).to.have.attribute('hidden');
    });

    it('should keep indicator mounted when checked', async () => {
      const { container } = await render(
        <Checkbox.Root checked>
          <Checkbox.Indicator keepMounted animated={false} />
        </Checkbox.Root>,
      );
      const indicator = container.querySelector('span');
      expect(indicator).not.to.equal(null);
      expect(indicator).not.to.have.attribute('hidden');
    });

    it('should keep indicator mounted when indeterminate', async () => {
      const { container } = await render(
        <Checkbox.Root indeterminate>
          <Checkbox.Indicator keepMounted animated={false} />
        </Checkbox.Root>,
      );
      const indicator = container.querySelector('span');
      expect(indicator).not.to.equal(null);
      expect(indicator).not.to.have.attribute('hidden');
    });
  });
});
