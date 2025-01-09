import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, flushMicrotasks } from '@mui/internal-test-utils';
import {
  DirectionProvider,
  type TextDirection,
} from '@base-ui-components/react/direction-provider';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Toggle } from '@base-ui-components/react/toggle';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<ToggleGroup />', () => {
  const { render } = createRenderer();

  describeConformance(<ToggleGroup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  it('renders a `group`', async () => {
    const { queryByRole } = await render(<ToggleGroup aria-label="My Toggle Group" />);

    expect(queryByRole('group', { name: 'My Toggle Group' })).not.to.equal(null);
  });

  describe('uncontrolled', () => {
    it('pressed state', async ({ skip }) => {
      if (isJSDOM) {
        skip();
      }

      const { getAllByRole, user } = await render(
        <ToggleGroup>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(button1).to.have.attribute('aria-pressed', 'false');
      expect(button2).to.have.attribute('aria-pressed', 'false');

      await user.click(button1);

      expect(button1).to.have.attribute('aria-pressed', 'true');
      expect(button1).to.have.attribute('data-pressed');
      expect(button2).to.have.attribute('aria-pressed', 'false');

      await user.click(button2);

      expect(button2).to.have.attribute('aria-pressed', 'true');
      expect(button2).to.have.attribute('data-pressed');
      expect(button1).to.have.attribute('aria-pressed', 'false');
    });

    it('prop: defaultValue', async () => {
      const { getAllByRole, user } = await render(
        <ToggleGroup defaultValue={['two']}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(button2).to.have.attribute('aria-pressed', 'true');
      expect(button2).to.have.attribute('data-pressed');
      expect(button1).to.have.attribute('aria-pressed', 'false');

      await user.click(button1);

      expect(button1).to.have.attribute('aria-pressed', 'true');
      expect(button1).to.have.attribute('data-pressed');
      expect(button2).to.have.attribute('aria-pressed', 'false');
    });
  });

  describe('controlled', () => {
    it('pressed state', async () => {
      const { getAllByRole, setProps } = await render(
        <ToggleGroup value={['two']}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(button1).to.have.attribute('aria-pressed', 'false');
      expect(button2).to.have.attribute('aria-pressed', 'true');
      expect(button2).to.have.attribute('data-pressed');

      setProps({ value: ['one'] });
      await flushMicrotasks();

      expect(button1).to.have.attribute('aria-pressed', 'true');
      expect(button1).to.have.attribute('data-pressed');
      expect(button2).to.have.attribute('aria-pressed', 'false');

      setProps({ value: ['two'] });
      await flushMicrotasks();

      expect(button2).to.have.attribute('aria-pressed', 'true');
      expect(button2).to.have.attribute('data-pressed');
      expect(button1).to.have.attribute('aria-pressed', 'false');
    });

    it('prop: value', async () => {
      const { getAllByRole, setProps } = await render(
        <ToggleGroup value={['two']}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(button2).to.have.attribute('aria-pressed', 'true');
      expect(button2).to.have.attribute('data-pressed');
      expect(button1).to.have.attribute('aria-pressed', 'false');

      setProps({ value: ['one'] });
      await flushMicrotasks();

      expect(button1).to.have.attribute('aria-pressed', 'true');
      expect(button1).to.have.attribute('data-pressed');
      expect(button2).to.have.attribute('aria-pressed', 'false');
    });
  });

  describe('prop: disabled', () => {
    it('can disable the whole group', async () => {
      const { getAllByRole } = await render(
        <ToggleGroup disabled>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(button1).to.have.attribute('disabled');
      expect(button1).to.have.attribute('data-disabled');
      expect(button2).to.have.attribute('disabled');
      expect(button2).to.have.attribute('data-disabled');
    });

    it('can disable individual items', async () => {
      const { getAllByRole } = await render(
        <ToggleGroup>
          <Toggle value="one" />
          <Toggle value="two" disabled />
        </ToggleGroup>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(button1).to.not.have.attribute('disabled');
      expect(button1).to.not.have.attribute('data-disabled');
      expect(button2).to.have.attribute('disabled');
      expect(button2).to.have.attribute('data-disabled');
    });
  });

  describe('prop: orientation', () => {
    it('vertical', async () => {
      const { queryByRole } = await render(
        <ToggleGroup orientation="vertical">
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>,
      );

      const group = queryByRole('group');
      expect(group).to.have.attribute('data-orientation', 'vertical');
    });
  });

  describe('prop: toggleMultiple', () => {
    it('multiple items can be pressed when true', async () => {
      const { getAllByRole, user } = await render(
        <ToggleGroup toggleMultiple defaultValue={['one']}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(button1).to.have.attribute('aria-pressed', 'true');
      expect(button2).to.have.attribute('aria-pressed', 'false');

      await user.click(button2);

      expect(button1).to.have.attribute('aria-pressed', 'true');
      expect(button2).to.have.attribute('aria-pressed', 'true');
    });

    it('only one item can be pressed when false', async () => {
      const { getAllByRole, user } = await render(
        <ToggleGroup toggleMultiple={false} defaultValue={['one']}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(button1).to.have.attribute('aria-pressed', 'true');
      expect(button2).to.have.attribute('aria-pressed', 'false');

      await user.click(button2);

      expect(button1).to.have.attribute('aria-pressed', 'false');
      expect(button2).to.have.attribute('aria-pressed', 'true');
    });
  });

  describe.skipIf(isJSDOM)('keyboard interactions', () => {
    [
      ['ltr', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'],
      ['rtl', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'],
    ].forEach((entry) => {
      const [direction, horizontalNextKey, verticalNextKey, horizontalPrevKey, verticalPrevKey] =
        entry;

      it(direction, async () => {
        const { getAllByRole, user } = await render(
          <DirectionProvider direction={direction as TextDirection}>
            <ToggleGroup>
              <Toggle value="one" />
              <Toggle value="two" />
              <Toggle value="three" />
            </ToggleGroup>
          </DirectionProvider>,
        );

        const [button1, button2, button3] = getAllByRole('button');

        await user.keyboard('[Tab]');

        expect(button1).to.have.attribute('data-highlighted');
        expect(button1).to.have.attribute('tabindex', '0');
        expect(button1).toHaveFocus();

        await user.keyboard(`[${horizontalNextKey}]`);

        expect(button2).to.have.attribute('data-highlighted');
        expect(button2).to.have.attribute('tabindex', '0');
        expect(button2).toHaveFocus();

        await user.keyboard(`[${horizontalNextKey}]`);

        expect(button3).to.have.attribute('data-highlighted');
        expect(button3).to.have.attribute('tabindex', '0');
        expect(button3).toHaveFocus();

        await user.keyboard(`[${verticalNextKey}]`);

        expect(button1).to.have.attribute('data-highlighted');
        expect(button1).to.have.attribute('tabindex', '0');
        expect(button1).toHaveFocus();

        await user.keyboard(`[${verticalNextKey}]`);

        expect(button2).to.have.attribute('data-highlighted');
        expect(button2).to.have.attribute('tabindex', '0');
        expect(button2).toHaveFocus();

        await user.keyboard(`[${horizontalPrevKey}]`);

        expect(button1).to.have.attribute('data-highlighted');
        expect(button1).to.have.attribute('tabindex', '0');
        expect(button1).toHaveFocus();

        await user.keyboard(`[${verticalPrevKey}]`);

        expect(button3).to.have.attribute('data-highlighted');
        expect(button3).to.have.attribute('tabindex', '0');
        expect(button3).toHaveFocus();
      });
    });

    ['Enter', 'Space'].forEach((key) => {
      it(`key: ${key} toggles the pressed state`, async () => {
        const { getAllByRole, user } = await render(
          <ToggleGroup>
            <Toggle value="one" />
            <Toggle value="two" />
          </ToggleGroup>,
        );

        const [button1] = getAllByRole('button');

        expect(button1).to.have.attribute('aria-pressed', 'false');

        await act(async () => {
          button1.focus();
        });

        await user.keyboard(`[${key}]`);

        expect(button1).to.have.attribute('aria-pressed', 'true');

        await user.keyboard(`[${key}]`);

        expect(button1).to.have.attribute('aria-pressed', 'false');
      });
    });
  });

  describe('prop: onValueChange', () => {
    it('fires when an Item is clicked', async () => {
      const onValueChange = spy();

      const { getAllByRole, user } = await render(
        <ToggleGroup onValueChange={onValueChange}>
          <Toggle value="one" />
          <Toggle value="two" />
        </ToggleGroup>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(onValueChange.callCount).to.equal(0);

      await user.click(button1);

      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.args[0][0]).to.deep.equal(['one']);

      await user.click(button2);

      expect(onValueChange.callCount).to.equal(2);
      expect(onValueChange.args[1][0]).to.deep.equal(['two']);
    });

    ['Enter', 'Space'].forEach((key) => {
      it(`fires when when the ${key} is pressed`, async ({ skip }) => {
        if (isJSDOM) {
          skip();
        }

        const onValueChange = spy();

        const { getAllByRole, user } = await render(
          <ToggleGroup onValueChange={onValueChange}>
            <Toggle value="one" />
            <Toggle value="two" />
          </ToggleGroup>,
        );

        const [button1, button2] = getAllByRole('button');

        expect(onValueChange.callCount).to.equal(0);

        await act(async () => {
          button1.focus();
        });

        await user.keyboard(`[${key}]`);

        expect(onValueChange.callCount).to.equal(1);
        expect(onValueChange.args[0][0]).to.deep.equal(['one']);

        await act(async () => {
          button2.focus();
        });

        await user.keyboard(`[${key}]`);

        expect(onValueChange.callCount).to.equal(2);
        expect(onValueChange.args[1][0]).to.deep.equal(['two']);
      });
    });
  });
});
