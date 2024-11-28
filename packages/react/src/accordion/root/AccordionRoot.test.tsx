import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { describeSkipIf, flushMicrotasks } from '@mui/internal-test-utils';
import { Accordion } from '@base-ui-components/react/accordion';
import { createRenderer, describeConformance } from '#test-utils';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

const PANEL_CONTENT_1 = 'Panel contents 1';
const PANEL_CONTENT_2 = 'Panel contents 2';

describe('<Accordion.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Root />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  describe('ARIA attributes', () => {
    it('renders correct ARIA attributes', async () => {
      const { getByRole, queryByText, container } = await render(
        <Accordion.Root defaultValue={[0]}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger id="Trigger1">Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel id="Panel1">{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const root = container.firstElementChild as HTMLElement;
      const trigger = getByRole('button');
      const panel = queryByText(PANEL_CONTENT_1);

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
      if (isJSDOM) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
      }

      const { getByRole, queryByText, user } = await render(
        <Accordion.Root animated={false}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const trigger = getByRole('button');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(queryByText(PANEL_CONTENT_1)).to.equal(null);

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(trigger).to.have.attribute('data-panel-open');
      expect(queryByText(PANEL_CONTENT_1)).to.not.equal(null);
      expect(queryByText(PANEL_CONTENT_1)).toBeVisible();
      expect(queryByText(PANEL_CONTENT_1)).to.have.attribute('data-open');

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(queryByText(PANEL_CONTENT_1)).to.equal(null);
    });

    describe('prop: defaultValue', () => {
      it('default item value', async () => {
        const { queryByText } = await render(
          <Accordion.Root animated={false} defaultValue={[1]}>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        expect(queryByText(PANEL_CONTENT_1)).to.equal(null);

        expect(queryByText(PANEL_CONTENT_2)).toBeVisible();
        expect(queryByText(PANEL_CONTENT_2)).to.have.attribute('data-open');
      });

      it('custom item value', async () => {
        const { queryByText } = await render(
          <Accordion.Root animated={false} defaultValue={['first']}>
            <Accordion.Item value="first">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="second">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        expect(queryByText(PANEL_CONTENT_1)).to.not.equal(null);
        expect(queryByText(PANEL_CONTENT_1)).toBeVisible();
        expect(queryByText(PANEL_CONTENT_1)).to.have.attribute('data-open');

        expect(queryByText(PANEL_CONTENT_2)).to.equal(null);
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
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const trigger = getByRole('button');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(queryByText(PANEL_CONTENT_1)).to.equal(null);

      setProps({ value: [0] });
      await flushMicrotasks();

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(trigger).to.have.attribute('data-panel-open');
      expect(queryByText(PANEL_CONTENT_1)).to.not.equal(null);
      expect(queryByText(PANEL_CONTENT_1)).toBeVisible();
      expect(queryByText(PANEL_CONTENT_1)).to.have.attribute('data-open');

      setProps({ value: [] });
      await flushMicrotasks();

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(queryByText(PANEL_CONTENT_1)).to.equal(null);
    });

    describe('prop: value', () => {
      it('default item value', async () => {
        const { queryByText } = await render(
          <Accordion.Root animated={false} value={[1]}>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        expect(queryByText(PANEL_CONTENT_1)).to.equal(null);

        expect(queryByText(PANEL_CONTENT_2)).toBeVisible();
        expect(queryByText(PANEL_CONTENT_2)).to.have.attribute('data-open');
      });

      it('custom item value', async () => {
        const { queryByText } = await render(
          <Accordion.Root animated={false} value={['one']}>
            <Accordion.Item value="one">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="second">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        expect(queryByText(PANEL_CONTENT_1)).to.not.equal(null);
        expect(queryByText(PANEL_CONTENT_1)).toBeVisible();
        expect(queryByText(PANEL_CONTENT_1)).to.have.attribute('data-open');

        expect(queryByText(PANEL_CONTENT_2)).to.equal(null);
      });
    });
  });

  describe('prop: disabled', () => {
    it('can disable the whole accordion', async () => {
      const { getByTestId, getAllByRole, queryByText } = await render(
        <Accordion.Root animated={false} defaultValue={[0]} disabled>
          <Accordion.Item data-testid="item1">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item data-testid="item2">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const item1 = getByTestId('item1');
      const panel1 = queryByText(PANEL_CONTENT_1);
      const [header1, header2] = getAllByRole('heading');
      const [trigger1, trigger2] = getAllByRole('button');
      const item2 = getByTestId('item2');

      [item1, header1, trigger1, panel1, item2, header2, trigger2].forEach((element) => {
        expect(element).to.have.attribute('data-disabled');
      });
    });

    it('can disable one accordion item', async () => {
      const { getAllByRole, getByTestId, queryByText } = await render(
        <Accordion.Root animated={false} defaultValue={[0]}>
          <Accordion.Item data-testid="item1" disabled>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item data-testid="item2">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const item1 = getByTestId('item1');
      const panel1 = queryByText(PANEL_CONTENT_1);
      const [header1, header2] = getAllByRole('heading');
      const [trigger1, trigger2] = getAllByRole('button');
      const item2 = getByTestId('item2');

      [item1, header1, trigger1, panel1].forEach((element) => {
        expect(element).to.have.attribute('data-disabled');
      });
      [item2, header2, trigger2].forEach((element) => {
        expect(element).to.not.have.attribute('data-disabled');
      });
    });
  });

  describeSkipIf(isJSDOM)('keyboard interactions', () => {
    ['Enter', 'Space'].forEach((key) => {
      it(`key: ${key} toggles the Accordion open state`, async () => {
        const { getByRole, queryByText, user } = await render(
          <Accordion.Root animated={false}>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const trigger = getByRole('button');

        expect(trigger).to.have.attribute('aria-expanded', 'false');

        expect(queryByText(PANEL_CONTENT_1)).to.equal(null);

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        await user.keyboard(`[${key}]`);

        expect(trigger).to.have.attribute('aria-expanded', 'true');
        expect(trigger).to.have.attribute('data-panel-open');
        expect(queryByText(PANEL_CONTENT_1)).to.not.equal(null);
        expect(queryByText(PANEL_CONTENT_1)).toBeVisible();
        expect(queryByText(PANEL_CONTENT_1)).to.have.attribute('data-open');

        await user.keyboard(`[${key}]`);

        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(queryByText(PANEL_CONTENT_1)).to.equal(null);
      });
    });

    it('ArrowUp and ArrowDown moves focus between triggers and loops by default', async () => {
      const { getAllByRole, user } = await render(
        <Accordion.Root animated={false}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const [trigger1, trigger2] = getAllByRole('button');

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
      const { getAllByRole, user } = await render(
        <Accordion.Root animated={false}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item disabled>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 3</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>This is the contents of Accordion.Panel 3</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const [trigger1, , trigger3] = getAllByRole('button');

      await user.keyboard('[Tab]');
      expect(trigger1).toHaveFocus();

      await user.keyboard('[ArrowDown]');
      expect(trigger3).toHaveFocus();

      await user.keyboard('[ArrowUp]');
      expect(trigger1).toHaveFocus();
    });

    describe('key: End/Home', () => {
      it('End key moves focus the last trigger', async () => {
        const { getAllByRole, user } = await render(
          <Accordion.Root animated={false}>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>1</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item disabled>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>2</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 3</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 3</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 4</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 4</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const [trigger1, , , trigger4] = getAllByRole('button');

        await user.keyboard('[Tab]');
        expect(trigger1).toHaveFocus();

        await user.keyboard('[End]');
        expect(trigger4).toHaveFocus();
      });

      it('Home key moves focus to the first trigger', async () => {
        const { getAllByRole, user } = await render(
          <Accordion.Root animated={false}>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>1</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item disabled>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>2</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 3</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 3</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 4</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>This is the contents of Accordion.Panel 4</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const [trigger1, , , trigger4] = getAllByRole('button');

        await user.pointer({ keys: '[MouseLeft]', target: trigger4 });
        expect(trigger4).toHaveFocus();

        await user.keyboard('[Home]');
        expect(trigger1).toHaveFocus();
      });
    });

    describe('prop: loop', () => {
      it('can disable focus looping between triggers', async () => {
        const { getAllByRole, user } = await render(
          <Accordion.Root animated={false} loop={false}>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>1</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>2</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const [trigger1, trigger2] = getAllByRole('button');

        await user.keyboard('[Tab]');
        expect(trigger1).toHaveFocus();

        await user.keyboard('[ArrowDown]');
        expect(trigger2).toHaveFocus();

        await user.keyboard('[ArrowDown]');
        expect(trigger2).toHaveFocus();
      });
    });
  });

  describeSkipIf(isJSDOM)('prop: openMultiple', () => {
    it('multiple items can be open by default', async () => {
      const { getAllByRole, queryByText, user } = await render(
        <Accordion.Root animated={false}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const [trigger1, trigger2] = getAllByRole('button');

      expect(trigger1).to.not.have.attribute('data-panel-open');
      expect(trigger2).to.not.have.attribute('data-panel-open');
      expect(queryByText(PANEL_CONTENT_1)).to.equal(null);
      expect(queryByText(PANEL_CONTENT_2)).to.equal(null);

      await user.pointer({ keys: '[MouseLeft]', target: trigger1 });
      await user.pointer({ keys: '[MouseLeft]', target: trigger2 });

      expect(queryByText(PANEL_CONTENT_1)).to.have.attribute('data-open');
      expect(queryByText(PANEL_CONTENT_2)).to.have.attribute('data-open');
      expect(trigger1).to.have.attribute('data-panel-open');
      expect(trigger2).to.have.attribute('data-panel-open');
    });

    it('when false only one item can be open', async () => {
      const { getAllByRole, queryByText, user } = await render(
        <Accordion.Root animated={false} openMultiple={false}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const [trigger1, trigger2] = getAllByRole('button');

      expect(queryByText(PANEL_CONTENT_1)).to.equal(null);
      expect(queryByText(PANEL_CONTENT_2)).to.equal(null);
      expect(trigger1).to.not.have.attribute('data-panel-open');
      expect(trigger2).to.not.have.attribute('data-panel-open');

      await user.pointer({ keys: '[MouseLeft]', target: trigger1 });

      expect(queryByText(PANEL_CONTENT_1)).to.have.attribute('data-open');
      expect(trigger1).to.have.attribute('data-panel-open');

      await user.pointer({ keys: '[MouseLeft]', target: trigger2 });

      expect(queryByText(PANEL_CONTENT_2)).to.have.attribute('data-open');
      expect(trigger2).to.have.attribute('data-panel-open');
      expect(queryByText(PANEL_CONTENT_1)).to.equal(null);
      expect(trigger1).to.not.have.attribute('data-panel-open');
    });
  });

  describeSkipIf(isJSDOM)('horizontal orientation', () => {
    it('ArrowLeft/Right moves focus in horizontal orientation', async () => {
      const { getAllByRole, user } = await render(
        <Accordion.Root animated={false} orientation="horizontal">
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const [trigger1, trigger2] = getAllByRole('button');

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

    describeSkipIf(isJSDOM)('RTL', () => {
      it('ArrowLeft/Right is reversed for horizontal accordions in RTL mode', async () => {
        const { getAllByRole, user } = await render(
          <Accordion.Root animated={false} orientation="horizontal" direction="rtl">
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>1</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>2</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const [trigger1, trigger2] = getAllByRole('button');

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

  describeSkipIf(isJSDOM)('prop: onValueChange', () => {
    it('default item value', async () => {
      const onValueChange = spy();

      const { getAllByRole, user } = await render(
        <Accordion.Root animated={false} onValueChange={onValueChange}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const [trigger1, trigger2] = getAllByRole('button');

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

      const { getAllByRole, user } = await render(
        <Accordion.Root animated={false} onValueChange={onValueChange}>
          <Accordion.Item value="one">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="two">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const [trigger1, trigger2] = getAllByRole('button');

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

      const { getAllByRole, user } = await render(
        <Accordion.Root animated={false} onValueChange={onValueChange} openMultiple={false}>
          <Accordion.Item value="one">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="two">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const [trigger1, trigger2] = getAllByRole('button');

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
