import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { describeSkipIf, flushMicrotasks } from '@mui/internal-test-utils';
import { Accordion } from '@base-ui-components/react/accordion';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Accordion.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Root />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  describe('ARIA attributes', () => {
    it('renders correct ARIA attributes', async () => {
      const { getByRole, getByTestId } = await render(
        <Accordion.Root data-testid="root">
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger id="Trigger1">Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel data-testid="panel" id="Panel1">
              This is the contents of Accordion.Panel 1
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const root = getByTestId('root');
      const trigger = getByRole('button');
      const panel = getByTestId('panel');

      expect(root).to.have.attribute('role', 'region');
      expect(trigger).to.have.attribute('id', 'Trigger1');
      expect(trigger).to.have.attribute('aria-controls', 'Panel1');
      expect(panel).to.have.attribute('role', 'region');
      expect(panel).to.have.attribute('id', 'Panel1');
      expect(panel).to.have.attribute('aria-labelledby', 'Trigger1');
    });
  });

  describe('uncontrolled', () => {
    it('open state', async function test(t = {}) {
      if (/jsdom/.test(window.navigator.userAgent)) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
      }

      const { getByRole, queryByText, user } = await render(
        <Accordion.Root data-testid="root" animated={false}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Panel contents</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const trigger = getByRole('button');
      const panel = queryByText('Panel contents');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(panel).not.toBeVisible();

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(trigger).to.have.attribute('data-panel-open');
      expect(panel).toBeVisible();
      expect(panel).to.have.attribute('data-open');

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(panel).not.toBeVisible();
    });

    describe('prop: defaultValue', () => {
      it('default item value', async () => {
        const { queryByText } = await render(
          <Accordion.Root data-testid="root" animated={false} defaultValue={[1]}>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>Panel contents 1</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>Panel contents 2</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const panel1 = queryByText('Panel contents 1');
        const panel2 = queryByText('Panel contents 2');

        expect(panel1).not.toBeVisible();
        expect(panel2).toBeVisible();
        expect(panel2).to.have.attribute('data-open');
      });

      it('custom item value', async () => {
        const { queryByText } = await render(
          <Accordion.Root data-testid="root" animated={false} defaultValue={['first']}>
            <Accordion.Item value="first">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>Panel contents 1</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="second">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>Panel contents 2</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const panel1 = queryByText('Panel contents 1');
        const panel2 = queryByText('Panel contents 2');

        expect(panel1).toBeVisible();
        expect(panel1).to.have.attribute('data-open');
        expect(panel2).not.toBeVisible();
      });
    });
  });

  describe('controlled', () => {
    it('open state', async () => {
      const { getByRole, queryByText, setProps } = await render(
        <Accordion.Root animated={false} value={[]}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Panel contents 1</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const trigger = getByRole('button');
      const panel = queryByText('Panel contents 1');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(panel).not.toBeVisible();

      setProps({ value: [0] });
      await flushMicrotasks();

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(trigger).to.have.attribute('data-panel-open');
      expect(panel).toBeVisible();
      expect(panel).to.have.attribute('data-open');

      setProps({ value: [] });
      await flushMicrotasks();

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(panel).not.toBeVisible();
    });

    describe('prop: value', () => {
      it('default item value', async () => {
        const { queryByText } = await render(
          <Accordion.Root data-testid="root" animated={false} value={[1]}>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>Panel contents 1</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>Panel contents 2</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const panel1 = queryByText('Panel contents 1');
        const panel2 = queryByText('Panel contents 2');

        expect(panel1).not.toBeVisible();
        expect(panel2).toBeVisible();
        expect(panel2).to.have.attribute('data-open');
      });

      it('custom item value', async () => {
        const { queryByText } = await render(
          <Accordion.Root data-testid="root" animated={false} value={['one']}>
            <Accordion.Item value="one">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>Panel contents 1</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="second">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>Panel contents 2</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const panel1 = queryByText('Panel contents 1');
        const panel2 = queryByText('Panel contents 2');

        expect(panel1).toBeVisible();
        expect(panel1).to.have.attribute('data-open');
        expect(panel2).not.toBeVisible();
      });
    });
  });

  describe('prop: disabled', () => {
    it('can disable the whole accordion', async () => {
      const { getByTestId, queryByText } = await render(
        <Accordion.Root animated={false} disabled>
          <Accordion.Item data-testid="item1">
            <Accordion.Header data-testid="header1">
              <Accordion.Trigger data-testid="trigger1">Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Panel contents 1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item data-testid="item2">
            <Accordion.Header data-testid="header2">
              <Accordion.Trigger data-testid="trigger2">Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Panel contents 2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const item1 = getByTestId('item1');
      const header1 = getByTestId('header1');
      const trigger1 = getByTestId('trigger1');
      const panel1 = queryByText('Panel contents 1');
      const item2 = getByTestId('item2');
      const header2 = getByTestId('header2');
      const trigger2 = getByTestId('trigger2');
      const panel2 = queryByText('Panel contents 2');

      [item1, header1, trigger1, panel1, item2, header2, trigger2, panel2].forEach((element) => {
        expect(element).to.have.attribute('data-disabled');
      });
    });

    it('can disable one accordion item', async () => {
      const { getByTestId, queryByText } = await render(
        <Accordion.Root animated={false}>
          <Accordion.Item data-testid="item1" disabled>
            <Accordion.Header data-testid="header1">
              <Accordion.Trigger data-testid="trigger1">Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Panel contents 1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item data-testid="item2">
            <Accordion.Header data-testid="header2">
              <Accordion.Trigger data-testid="trigger2">Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Panel contents 2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const item1 = getByTestId('item1');
      const header1 = getByTestId('header1');
      const trigger1 = getByTestId('trigger1');
      const panel1 = queryByText('Panel contents 1');
      const item2 = getByTestId('item2');
      const header2 = getByTestId('header2');
      const trigger2 = getByTestId('trigger2');
      const panel2 = queryByText('Panel contents 2');

      [item1, header1, trigger1, panel1].forEach((element) => {
        expect(element).to.have.attribute('data-disabled');
      });
      [item2, header2, trigger2, panel2].forEach((element) => {
        expect(element).to.not.have.attribute('data-disabled');
      });
    });
  });

  describeSkipIf(/jsdom/.test(window.navigator.userAgent))('keyboard interactions', () => {
    ['Enter', 'Space'].forEach((key) => {
      it(`key: ${key} toggles the Accordion open state`, async () => {
        const { getByRole, queryByText, user } = await render(
          <Accordion.Root animated={false}>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>Panel contents 1</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const trigger = getByRole('button');
        const panel = queryByText('Panel contents 1');

        expect(trigger).to.have.attribute('aria-expanded', 'false');

        expect(panel).not.toBeVisible();

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        await user.keyboard(`[${key}]`);

        expect(trigger).to.have.attribute('aria-expanded', 'true');
        expect(trigger).to.have.attribute('data-panel-open');
        expect(panel).toBeVisible();
        expect(panel).to.have.attribute('data-open');

        await user.keyboard(`[${key}]`);

        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(panel).not.toBeVisible();
      });
    });

    it('ArrowUp and ArrowDown moves focus between triggers and loops by default', async () => {
      const { getByTestId, user } = await render(
        <Accordion.Root animated={false}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger1">Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This is the contents of Accordion.Panel 1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger2">Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This is the contents of Accordion.Panel 2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const trigger1 = getByTestId('trigger1');
      const trigger2 = getByTestId('trigger2');

      await user.keyboard('[Tab]');
      expect(trigger1).toHaveFocus();

      await user.keyboard('[ArrowDown]');
      expect(trigger2).toHaveFocus();

      await user.keyboard('[ArrowUp]');
      expect(trigger1).toHaveFocus();

      await user.keyboard('[ArrowDown]');
      expect(trigger2).toHaveFocus();

      await user.keyboard('[ArrowDown]');
      expect(trigger1).toHaveFocus();
    });

    it('Arrow keys should not put focus on disabled accordion items', async () => {
      const { getByTestId, user } = await render(
        <Accordion.Root animated={false}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger1">Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This is the contents of Accordion.Panel 1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item disabled>
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger2">Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This is the contents of Accordion.Panel 2</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger3">Trigger 3</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This is the contents of Accordion.Panel 3</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const trigger1 = getByTestId('trigger1');
      const trigger3 = getByTestId('trigger3');

      await user.keyboard('[Tab]');
      expect(trigger1).toHaveFocus();

      await user.keyboard('[ArrowDown]');
      expect(trigger3).toHaveFocus();

      await user.keyboard('[ArrowUp]');
      expect(trigger1).toHaveFocus();
    });

    describe('key: End/Home', () => {
      it('End key moves focus the last trigger', async () => {
        const { getByTestId, user } = await render(
          <Accordion.Root animated={false}>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger data-testid="trigger1">Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 1</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item disabled>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 2</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 3</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 3</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger data-testid="triggerFour">Trigger 4</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 4</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const trigger1 = getByTestId('trigger1');
        const triggerFour = getByTestId('triggerFour');

        await user.keyboard('[Tab]');
        expect(trigger1).toHaveFocus();

        await user.keyboard('[End]');
        expect(triggerFour).toHaveFocus();
      });

      it('Home key moves focus to the first trigger', async () => {
        const { getByTestId, user } = await render(
          <Accordion.Root animated={false}>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger data-testid="trigger1">Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 1</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item disabled>
              <Accordion.Header>
                <Accordion.Trigger data-testid="trigger2">Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 2</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger data-testid="trigger3">Trigger 3</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 3</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger data-testid="triggerFour">Trigger 4</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 4</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const trigger1 = getByTestId('trigger1');
        const triggerFour = getByTestId('triggerFour');

        await user.pointer({ keys: '[MouseLeft]', target: triggerFour });
        expect(triggerFour).toHaveFocus();

        await user.keyboard('[Home]');
        expect(trigger1).toHaveFocus();
      });
    });

    describe('prop: loop', () => {
      it('can disable focus looping between triggers', async () => {
        const { getByTestId, user } = await render(
          <Accordion.Root animated={false} loop={false}>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger data-testid="trigger1">Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 1</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger data-testid="trigger2">Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 2</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const trigger1 = getByTestId('trigger1');
        const trigger2 = getByTestId('trigger2');

        await user.keyboard('[Tab]');
        expect(trigger1).toHaveFocus();

        await user.keyboard('[ArrowDown]');
        expect(trigger2).toHaveFocus();

        await user.keyboard('[ArrowDown]');
        expect(trigger2).toHaveFocus();
      });
    });
  });

  describeSkipIf(/jsdom/.test(window.navigator.userAgent))('prop: openMultiple', () => {
    it('multiple items can be open by default', async () => {
      const { getByTestId, queryByText, user } = await render(
        <Accordion.Root animated={false}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger1">Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Panel contents 1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger2">Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Panel contents 2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const trigger1 = getByTestId('trigger1');
      const panel1 = queryByText('Panel contents 1');
      const trigger2 = getByTestId('trigger2');
      const panel2 = queryByText('Panel contents 2');

      [trigger1, panel1, trigger2, panel2].forEach((element) => {
        expect(element).to.not.have.attribute('data-open');
      });

      await user.pointer({ keys: '[MouseLeft]', target: trigger1 });
      await user.pointer({ keys: '[MouseLeft]', target: trigger2 });

      expect(panel1).to.have.attribute('data-open');
      expect(panel2).to.have.attribute('data-open');
      expect(trigger1).to.have.attribute('data-panel-open');
      expect(trigger2).to.have.attribute('data-panel-open');
    });

    it('when false only one item can be open', async () => {
      const { getByTestId, queryByText, user } = await render(
        <Accordion.Root animated={false} openMultiple={false}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger1">Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Panel contents 1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger2">Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Panel contents 2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const trigger1 = getByTestId('trigger1');
      const panel1 = queryByText('Panel contents 1');
      const trigger2 = getByTestId('trigger2');
      const panel2 = queryByText('Panel contents 2');

      expect(panel1).to.not.have.attribute('data-open');
      expect(panel2).to.not.have.attribute('data-open');
      expect(trigger1).to.not.have.attribute('data-panel-open');
      expect(trigger2).to.not.have.attribute('data-panel-open');

      await user.pointer({ keys: '[MouseLeft]', target: trigger1 });

      expect(panel1).to.have.attribute('data-open');
      expect(trigger1).to.have.attribute('data-panel-open');

      await user.pointer({ keys: '[MouseLeft]', target: trigger2 });

      expect(panel2).to.have.attribute('data-open');
      expect(trigger2).to.have.attribute('data-panel-open');
      expect(panel1).to.not.have.attribute('data-open');
      expect(trigger1).to.not.have.attribute('data-panel-open');
    });
  });

  describeSkipIf(/jsdom/.test(window.navigator.userAgent))('horizontal orientation', () => {
    it('ArrowLeft/Right moves focus in horizontal orientation', async () => {
      const { getByTestId, user } = await render(
        <Accordion.Root animated={false} orientation="horizontal">
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger1">Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This is the contents of Accordion.Panel 1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger2">Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This is the contents of Accordion.Panel 2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const trigger1 = getByTestId('trigger1');
      const trigger2 = getByTestId('trigger2');

      await user.keyboard('[Tab]');
      expect(trigger1).toHaveFocus();

      await user.keyboard('[ArrowRight]');
      expect(trigger2).toHaveFocus();

      await user.keyboard('[ArrowLeft]');
      expect(trigger1).toHaveFocus();

      await user.keyboard('[ArrowRight]');
      expect(trigger2).toHaveFocus();

      await user.keyboard('[ArrowRight]');
      expect(trigger1).toHaveFocus();
    });

    describeSkipIf(/jsdom/.test(window.navigator.userAgent))('RTL', () => {
      it('ArrowLeft/Right is reversed for horizontal accordions in RTL mode', async () => {
        const { getByTestId, user } = await render(
          <Accordion.Root animated={false} orientation="horizontal" direction="rtl">
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger data-testid="trigger1">Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 1</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger data-testid="trigger2">Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 2</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const trigger1 = getByTestId('trigger1');
        const trigger2 = getByTestId('trigger2');

        await user.keyboard('[Tab]');
        expect(trigger1).toHaveFocus();

        await user.keyboard('[ArrowLeft]');
        expect(trigger2).toHaveFocus();

        await user.keyboard('[ArrowRight]');
        expect(trigger1).toHaveFocus();

        await user.keyboard('[ArrowLeft]');
        expect(trigger2).toHaveFocus();

        await user.keyboard('[ArrowLeft]');
        expect(trigger1).toHaveFocus();
      });
    });
  });

  describeSkipIf(/jsdom/.test(window.navigator.userAgent))('prop: onValueChange', () => {
    it('default item value', async () => {
      const onValueChange = spy();

      const { getByTestId, user } = await render(
        <Accordion.Root data-testid="root" animated={false} onValueChange={onValueChange}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger1">Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This is the contents of Accordion.Panel 1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger2">Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This is the contents of Accordion.Panel 2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const trigger1 = getByTestId('trigger1');
      const trigger2 = getByTestId('trigger2');

      expect(onValueChange.callCount).to.equal(0);

      await user.pointer({ keys: '[MouseLeft]', target: trigger1 });

      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.args[0][0]).to.deep.equal([0]);

      await user.pointer({ keys: '[MouseLeft]', target: trigger2 });

      expect(onValueChange.callCount).to.equal(2);
      expect(onValueChange.args[1][0]).to.deep.equal([0, 1]);
    });

    it('custom item value', async () => {
      const onValueChange = spy();

      const { getByTestId, user } = await render(
        <Accordion.Root data-testid="root" animated={false} onValueChange={onValueChange}>
          <Accordion.Item value="one">
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger1">Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This is the contents of Accordion.Panel 1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="two">
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger2">Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This is the contents of Accordion.Panel 2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const trigger1 = getByTestId('trigger1');
      const trigger2 = getByTestId('trigger2');

      expect(onValueChange.callCount).to.equal(0);

      await user.pointer({ keys: '[MouseLeft]', target: trigger2 });

      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.args[0][0]).to.deep.equal(['two']);

      await user.pointer({ keys: '[MouseLeft]', target: trigger1 });

      expect(onValueChange.callCount).to.equal(2);
      expect(onValueChange.args[1][0]).to.deep.equal(['two', 'one']);
    });

    it('openMultiple is false', async () => {
      const onValueChange = spy();

      const { getByTestId, user } = await render(
        <Accordion.Root
          data-testid="root"
          animated={false}
          onValueChange={onValueChange}
          openMultiple={false}
        >
          <Accordion.Item value="one">
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger1">Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This is the contents of Accordion.Panel 1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="two">
            <Accordion.Header>
              <Accordion.Trigger data-testid="trigger2">Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This is the contents of Accordion.Panel 2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const trigger1 = getByTestId('trigger1');
      const trigger2 = getByTestId('trigger2');

      expect(onValueChange.callCount).to.equal(0);

      await user.pointer({ keys: '[MouseLeft]', target: trigger1 });

      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.args[0][0]).to.deep.equal(['one']);

      await user.pointer({ keys: '[MouseLeft]', target: trigger2 });

      expect(onValueChange.callCount).to.equal(2);
      expect(onValueChange.args[1][0]).to.deep.equal(['two']);
    });
  });
});
