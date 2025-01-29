'use client';
import * as React from 'react';
import { expect } from 'chai';
import { flushMicrotasks } from '@mui/internal-test-utils';
import { Collapsible } from '@base-ui-components/react/collapsible';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

const PANEL_CONTENT = 'This is panel content';

describe('<Collapsible.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Collapsible.Root />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  describe('ARIA attributes', () => {
    it('sets ARIA attributes', async () => {
      const { getByTestId, getByRole } = await render(
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger />
          <Collapsible.Panel data-testid="panel" />
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');
      const panel = getByTestId('panel');

      expect(trigger).to.have.attribute('aria-expanded');

      expect(trigger.getAttribute('aria-controls')).to.equal(panel.getAttribute('id'));
    });
  });

  describe('open state', () => {
    it('controlled mode', async () => {
      const { queryByText, getByRole, setProps } = await render(
        <Collapsible.Root open={false}>
          <Collapsible.Trigger />
          <Collapsible.Panel>This is panel content</Collapsible.Panel>
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');

      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(queryByText(PANEL_CONTENT)).to.equal(null);

      setProps({ open: true });
      await flushMicrotasks();

      expect(trigger).to.have.attribute('aria-expanded', 'true');

      expect(queryByText(PANEL_CONTENT)).to.not.equal(null);
      expect(queryByText(PANEL_CONTENT)).toBeVisible();
      expect(queryByText(PANEL_CONTENT)).to.have.attribute('data-open');
      expect(trigger).to.have.attribute('data-panel-open');

      setProps({ open: false });
      await flushMicrotasks();

      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(queryByText(PANEL_CONTENT)).to.equal(null);
    });

    it('uncontrolled mode', async ({ skip }) => {
      if (isJSDOM) {
        skip();
      }
      const { getByRole, queryByText, user } = await render(
        <Collapsible.Root defaultOpen={false}>
          <Collapsible.Trigger />
          <Collapsible.Panel>This is panel content</Collapsible.Panel>
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');

      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(queryByText(PANEL_CONTENT)).to.equal(null);

      await user.click(trigger);

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(queryByText(PANEL_CONTENT)).to.not.equal(null);
      expect(queryByText(PANEL_CONTENT)).toBeVisible();
      expect(queryByText(PANEL_CONTENT)).to.have.attribute('data-open');
      expect(trigger).to.have.attribute('data-panel-open');

      await user.click(trigger);

      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(trigger).to.not.have.attribute('data-panel-open');
      expect(queryByText(PANEL_CONTENT)).to.equal(null);
    });
  });

  describe('prop: render', () => {
    it('does not render a root element when `null`', async () => {
      const { getByRole, container } = await render(
        <Collapsible.Root defaultOpen render={null}>
          <Collapsible.Trigger />
          <Collapsible.Panel>This is panel content</Collapsible.Panel>
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');
      expect(container.firstElementChild as HTMLElement).to.equal(trigger);
    });
  });

  describe.skipIf(isJSDOM)('keyboard interactions', () => {
    ['Enter', 'Space'].forEach((key) => {
      it(`key: ${key} should toggle the Collapsible`, async () => {
        const { queryByText, getByRole, user } = await render(
          <Collapsible.Root defaultOpen={false}>
            <Collapsible.Trigger>Trigger</Collapsible.Trigger>
            <Collapsible.Panel>This is panel content</Collapsible.Panel>
          </Collapsible.Root>,
        );

        const trigger = getByRole('button');

        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(queryByText(PANEL_CONTENT)).to.equal(null);

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        await user.keyboard(`[${key}]`);

        expect(trigger).to.have.attribute('aria-expanded', 'true');
        expect(trigger).to.have.attribute('data-panel-open');
        expect(queryByText(PANEL_CONTENT)).toBeVisible();
        expect(queryByText(PANEL_CONTENT)).to.not.equal(null);
        expect(queryByText(PANEL_CONTENT)).to.have.attribute('data-open');

        await user.keyboard(`[${key}]`);

        expect(trigger).to.not.have.attribute('aria-controls');
        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(trigger).not.to.have.attribute('data-panel-open');
        expect(queryByText(PANEL_CONTENT)).to.equal(null);
      });
    });
  });
});
