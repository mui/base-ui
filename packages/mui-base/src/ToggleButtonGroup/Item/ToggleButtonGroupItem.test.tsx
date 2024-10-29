import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act } from '@mui/internal-test-utils';
import { ToggleButtonGroup } from '@base_ui/react/ToggleButtonGroup';
import { createRenderer, describeConformance } from '#test-utils';
import { NOOP } from '../../utils/noop';
import { ToggleButtonGroupRootContext } from '../Root/ToggleButtonGroupRootContext';

const contextValue: ToggleButtonGroupRootContext = {
  value: [],
  setGroupValue: NOOP,
  disabled: false,
};

describe('<ToggleButtonGroup.Item />', () => {
  const { render } = createRenderer();

  describeConformance(<ToggleButtonGroup.Item value="bookmark" />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render: (node) =>
      render(
        <ToggleButtonGroupRootContext.Provider value={contextValue}>
          {node}
        </ToggleButtonGroupRootContext.Provider>,
      ),
  }));

  describe('prop: onPressedChange', () => {
    it('fires when an Item is clicked', async () => {
      const onPressedChange = spy();

      const { getAllByRole, user } = await render(
        <ToggleButtonGroup.Root>
          <ToggleButtonGroup.Item value="one" onPressedChange={onPressedChange} />
          <ToggleButtonGroup.Item value="two" />
        </ToggleButtonGroup.Root>,
      );

      const [button1] = getAllByRole('button');

      expect(onPressedChange.callCount).to.equal(0);

      await user.pointer({ keys: '[MouseLeft]', target: button1 });

      expect(onPressedChange.callCount).to.equal(1);
      expect(onPressedChange.args[0][0]).to.equal(true);

      await user.pointer({ keys: '[MouseLeft]', target: button1 });

      expect(onPressedChange.callCount).to.equal(2);
      expect(onPressedChange.args[1][0]).to.equal(false);
    });

    describe('keypresses', () => {
      ['Enter', 'Space'].forEach((key) => {
        it(`fires when when the ${key} is pressed`, async function test(t = {}) {
          if (/jsdom/.test(window.navigator.userAgent)) {
            // @ts-expect-error to support mocha and vitest
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            this?.skip?.() || t?.skip();
          }

          const onPressedChange = spy();

          const { getAllByRole, user } = await render(
            <ToggleButtonGroup.Root>
              <ToggleButtonGroup.Item value="one" onPressedChange={onPressedChange} />
              <ToggleButtonGroup.Item value="two" />
            </ToggleButtonGroup.Root>,
          );

          const [button1] = getAllByRole('button');

          expect(onPressedChange.callCount).to.equal(0);

          await act(async () => {
            button1.focus();
          });

          await user.keyboard(`[${key}]`);

          expect(onPressedChange.callCount).to.equal(1);
          expect(onPressedChange.args[0][0]).to.equal(true);

          await user.keyboard(`[${key}]`);

          expect(onPressedChange.callCount).to.equal(2);
          expect(onPressedChange.args[1][0]).to.equal(false);
        });
      });
    });
  });
});
