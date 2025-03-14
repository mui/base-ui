import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { spy } from 'sinon';
import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.Value />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Value />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<Select.Root open>{node}</Select.Root>);
    },
  }));

  describe('prop: placeholder', () => {
    it('renders a placeholder when the value is null', async () => {
      await render(
        <Select.Root>
          <Select.Value placeholder="Select a font" />
        </Select.Root>,
      );
      expect(screen.getByText('Select a font')).not.to.equal(null);
    });
  });

  describe('prop: children', () => {
    it('accepts a function with label and value parameters', async () => {
      const children = spy();
      await render(
        <Select.Root value="1">
          <Select.Value placeholder="placeholder">{children}</Select.Value>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="1">one</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(children.args[0][0]).to.equal('placeholder');
      expect(children.args[0][1]).to.equal('1');
      expect(children.args[4][0]).to.equal('one'); // 5th render
    });
  });
});
