import * as React from 'react';
import { expect } from 'chai';
import * as Checkbox from '@base_ui/react/Checkbox';
import { CheckboxContext } from '@base_ui/react/Checkbox';
import { createRenderer, describeConformance } from '#test-utils';

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
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <CheckboxContext.Provider value={testContext}>{node}</CheckboxContext.Provider>,
      );
    },
  }));

  it('should not render indicator by default', async () => {
    const { container } = await render(
      <Checkbox.Root>
        <Checkbox.Indicator />
      </Checkbox.Root>,
    );
    const indicator = container.querySelector('span');
    expect(indicator).to.equal(null);
  });

  it('should render indicator when checked', async () => {
    const { container } = await render(
      <Checkbox.Root checked>
        <Checkbox.Indicator />
      </Checkbox.Root>,
    );
    const indicator = container.querySelector('span');
    expect(indicator).not.to.equal(null);
  });

  it('should spread extra props', async () => {
    const { container } = await render(
      <Checkbox.Root defaultChecked>
        <Checkbox.Indicator data-extra-prop="Lorem ipsum" />
      </Checkbox.Root>,
    );
    const indicator = container.querySelector('span');
    expect(indicator).to.have.attribute('data-extra-prop', 'Lorem ipsum');
  });

  describe('keepMounted prop', () => {
    it('should keep indicator mounted when unchecked', async () => {
      const { container } = await render(
        <Checkbox.Root>
          <Checkbox.Indicator keepMounted />
        </Checkbox.Root>,
      );
      const indicator = container.querySelector('span');
      expect(indicator).not.to.equal(null);
    });

    it('should keep indicator mounted when checked', async () => {
      const { container } = await render(
        <Checkbox.Root checked>
          <Checkbox.Indicator keepMounted />
        </Checkbox.Root>,
      );
      const indicator = container.querySelector('span');
      expect(indicator).not.to.equal(null);
    });

    it('should keep indicator mounted when indeterminate', async () => {
      const { container } = await render(
        <Checkbox.Root indeterminate>
          <Checkbox.Indicator keepMounted />
        </Checkbox.Root>,
      );
      const indicator = container.querySelector('span');
      expect(indicator).not.to.equal(null);
    });
  });
});
