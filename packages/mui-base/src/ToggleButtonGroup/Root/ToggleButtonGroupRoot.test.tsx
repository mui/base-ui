import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, describeSkipIf, flushMicrotasks } from '@mui/internal-test-utils';
import { ToggleButtonGroup } from '@base_ui/react/ToggleButtonGroup';
import { createRenderer, describeConformance } from '#test-utils';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

describe('<ToggleButtonGroup.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<ToggleButtonGroup.Root />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  it('renders a `group`', async () => {
    const { queryByRole } = await render(<ToggleButtonGroup.Root aria-label="My Toggle Group" />);

    expect(queryByRole('group', { name: 'My Toggle Group' })).not.to.equal(null);
  });

  describe('uncontrolled', () => {
    it('pressed state', async function test(t = {}) {
      if (isJSDOM) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
      }

      const { getAllByRole, user } = await render(
        <ToggleButtonGroup.Root>
          <ToggleButtonGroup.Item value="one" />
          <ToggleButtonGroup.Item value="two" />
        </ToggleButtonGroup.Root>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(button1).to.have.attribute('aria-pressed', 'false');
      expect(button2).to.have.attribute('aria-pressed', 'false');

      await user.pointer({ keys: '[MouseLeft]', target: button1 });

      expect(button1).to.have.attribute('aria-pressed', 'true');
      expect(button1).to.have.attribute('data-pressed');
      expect(button2).to.have.attribute('aria-pressed', 'false');

      await user.pointer({ keys: '[MouseLeft]', target: button2 });

      expect(button2).to.have.attribute('aria-pressed', 'true');
      expect(button2).to.have.attribute('data-pressed');
      expect(button1).to.have.attribute('aria-pressed', 'false');
    });

    it('prop: defaultValue', async () => {
      const { getAllByRole, user } = await render(
        <ToggleButtonGroup.Root defaultValue={['two']}>
          <ToggleButtonGroup.Item value="one" />
          <ToggleButtonGroup.Item value="two" />
        </ToggleButtonGroup.Root>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(button2).to.have.attribute('aria-pressed', 'true');
      expect(button2).to.have.attribute('data-pressed');
      expect(button1).to.have.attribute('aria-pressed', 'false');

      await user.pointer({ keys: '[MouseLeft]', target: button1 });

      expect(button1).to.have.attribute('aria-pressed', 'true');
      expect(button1).to.have.attribute('data-pressed');
      expect(button2).to.have.attribute('aria-pressed', 'false');
    });
  });

  describe('controlled', () => {
    it('pressed state', async () => {
      const { getAllByRole, setProps } = await render(
        <ToggleButtonGroup.Root value={['two']}>
          <ToggleButtonGroup.Item value="one" />
          <ToggleButtonGroup.Item value="two" />
        </ToggleButtonGroup.Root>,
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
        <ToggleButtonGroup.Root value={['two']}>
          <ToggleButtonGroup.Item value="one" />
          <ToggleButtonGroup.Item value="two" />
        </ToggleButtonGroup.Root>,
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
        <ToggleButtonGroup.Root disabled>
          <ToggleButtonGroup.Item value="one" />
          <ToggleButtonGroup.Item value="two" />
        </ToggleButtonGroup.Root>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(button1).to.have.attribute('disabled');
      expect(button2).to.have.attribute('disabled');
    });

    it('can disable individual items', async () => {
      const { getAllByRole } = await render(
        <ToggleButtonGroup.Root>
          <ToggleButtonGroup.Item value="one" />
          <ToggleButtonGroup.Item value="two" disabled />
        </ToggleButtonGroup.Root>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(button1).to.not.have.attribute('disabled');
      expect(button2).to.have.attribute('disabled');
    });
  });

  describe('prop: toggleMultiple', () => {
    it('multiple items can be pressed when true', async () => {
      const { getAllByRole, user } = await render(
        <ToggleButtonGroup.Root toggleMultiple defaultValue={['one']}>
          <ToggleButtonGroup.Item value="one" />
          <ToggleButtonGroup.Item value="two" />
        </ToggleButtonGroup.Root>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(button1).to.have.attribute('aria-pressed', 'true');
      expect(button2).to.have.attribute('aria-pressed', 'false');

      await user.pointer({ keys: '[MouseLeft]', target: button2 });

      expect(button1).to.have.attribute('aria-pressed', 'true');
      expect(button2).to.have.attribute('aria-pressed', 'true');
    });

    it('only one item can be pressed when false', async () => {
      const { getAllByRole, user } = await render(
        <ToggleButtonGroup.Root toggleMultiple={false} defaultValue={['one']}>
          <ToggleButtonGroup.Item value="one" />
          <ToggleButtonGroup.Item value="two" />
        </ToggleButtonGroup.Root>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(button1).to.have.attribute('aria-pressed', 'true');
      expect(button2).to.have.attribute('aria-pressed', 'false');

      await user.pointer({ keys: '[MouseLeft]', target: button2 });

      expect(button1).to.have.attribute('aria-pressed', 'false');
      expect(button2).to.have.attribute('aria-pressed', 'true');
    });
  });

  describeSkipIf(isJSDOM)('keyboard interactions', () => {
    it('ltr', async () => {
      const { getAllByRole, user } = await render(
        <ToggleButtonGroup.Root>
          <ToggleButtonGroup.Item value="one" />
          <ToggleButtonGroup.Item value="two" />
        </ToggleButtonGroup.Root>,
      );

      const [button1, button2] = getAllByRole('button');

      await user.keyboard('[Tab]');

      expect(button1).to.have.attribute('data-active');
      expect(button1).to.have.attribute('tabindex', '0');
      expect(button1).toHaveFocus();

      await user.keyboard('[ArrowRight]');

      expect(button2).to.have.attribute('data-active');
      expect(button2).to.have.attribute('tabindex', '0');
      expect(button2).toHaveFocus();

      await user.keyboard('[ArrowRight]');

      expect(button1).to.have.attribute('data-active');
      expect(button1).to.have.attribute('tabindex', '0');
      expect(button1).toHaveFocus();

      await user.keyboard('[ArrowDown]');

      expect(button2).to.have.attribute('data-active');
      expect(button2).to.have.attribute('tabindex', '0');
      expect(button2).toHaveFocus();

      await user.keyboard('[ArrowDown]');

      expect(button1).to.have.attribute('data-active');
      expect(button1).to.have.attribute('tabindex', '0');
      expect(button1).toHaveFocus();
    });

    it('rtl', async () => {
      const { getAllByRole, user } = await render(
        <ToggleButtonGroup.Root direction="rtl">
          <ToggleButtonGroup.Item value="one" />
          <ToggleButtonGroup.Item value="two" />
        </ToggleButtonGroup.Root>,
      );

      const [button1, button2] = getAllByRole('button');

      await user.keyboard('[Tab]');

      expect(button1).to.have.attribute('data-active');
      expect(button1).to.have.attribute('tabindex', '0');
      expect(button1).toHaveFocus();

      await user.keyboard('[ArrowLeft]');

      expect(button2).to.have.attribute('data-active');
      expect(button2).to.have.attribute('tabindex', '0');
      expect(button2).toHaveFocus();

      await user.keyboard('[ArrowLeft]');

      expect(button1).to.have.attribute('data-active');
      expect(button1).to.have.attribute('tabindex', '0');
      expect(button1).toHaveFocus();

      await user.keyboard('[ArrowDown]');

      expect(button2).to.have.attribute('data-active');
      expect(button2).to.have.attribute('tabindex', '0');
      expect(button2).toHaveFocus();

      await user.keyboard('[ArrowDown]');

      expect(button1).to.have.attribute('data-active');
      expect(button1).to.have.attribute('tabindex', '0');
      expect(button1).toHaveFocus();
    });

    ['Enter', 'Space'].forEach((key) => {
      it(`key: ${key} toggles the pressed state`, async () => {
        const { getAllByRole, user } = await render(
          <ToggleButtonGroup.Root>
            <ToggleButtonGroup.Item value="one" />
            <ToggleButtonGroup.Item value="two" />
          </ToggleButtonGroup.Root>,
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
        <ToggleButtonGroup.Root onValueChange={onValueChange}>
          <ToggleButtonGroup.Item value="one" />
          <ToggleButtonGroup.Item value="two" />
        </ToggleButtonGroup.Root>,
      );

      const [button1, button2] = getAllByRole('button');

      expect(onValueChange.callCount).to.equal(0);

      await user.pointer({ keys: '[MouseLeft]', target: button1 });

      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.args[0][0]).to.deep.equal(['one']);

      await user.pointer({ keys: '[MouseLeft]', target: button2 });

      expect(onValueChange.callCount).to.equal(2);
      expect(onValueChange.args[1][0]).to.deep.equal(['two']);
    });

    ['Enter', 'Space'].forEach((key) => {
      it(`fires when when the ${key} is pressed`, async function test(t = {}) {
        if (isJSDOM) {
          // @ts-expect-error to support mocha and vitest
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          this?.skip?.() || t?.skip();
        }

        const onValueChange = spy();

        const { getAllByRole, user } = await render(
          <ToggleButtonGroup.Root onValueChange={onValueChange}>
            <ToggleButtonGroup.Item value="one" />
            <ToggleButtonGroup.Item value="two" />
          </ToggleButtonGroup.Root>,
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
