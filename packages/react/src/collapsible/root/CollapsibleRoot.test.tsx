'use client';
import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, describeSkipIf, flushMicrotasks } from '@mui/internal-test-utils';
import { Collapsible } from '@base-ui-components/react/collapsible';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Collapsible.Root />', () => {
  const { render } = createRenderer();

  // `render` is explicitly specified here because Collapsible.Root does not
  // render an element to the DOM by default and so the conformance tests would be unapplicable
  describeConformance(<Collapsible.Root render={<div />} />, () => ({
    inheritComponent: 'div',
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  describe('ARIA attributes', () => {
    it('sets ARIA attributes', async () => {
      const { getByTestId, getByRole } = await render(
        <Collapsible.Root animated={false}>
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
        <Collapsible.Root open={false} animated={false}>
          <Collapsible.Trigger />
          <Collapsible.Panel>This is content</Collapsible.Panel>
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');
      const panel = queryByText('This is content');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(panel).not.toBeVisible();

      setProps({ open: true });
      await flushMicrotasks();

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(panel).toBeVisible();
      expect(panel).to.have.attribute('data-open');
      expect(trigger).to.have.attribute('data-panel-open');

      setProps({ open: false });
      await flushMicrotasks();

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(panel).not.toBeVisible();
    });

    it('uncontrolled mode', async function test(t = {}) {
      if (/jsdom/.test(window.navigator.userAgent)) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
      }

      const { getByRole, queryByText, user } = await render(
        <Collapsible.Root defaultOpen={false} animated={false}>
          <Collapsible.Trigger />
          <Collapsible.Panel>This is content</Collapsible.Panel>
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');
      const panel = queryByText('This is content');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(panel).not.toBeVisible();

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(panel).toBeVisible();
      expect(panel).to.have.attribute('data-open');
      expect(trigger).to.have.attribute('data-panel-open');

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(trigger).to.not.have.attribute('data-panel-open');
      expect(panel).not.toBeVisible();
    });
  });

  describeSkipIf(/jsdom/.test(window.navigator.userAgent))('keyboard interactions', () => {
    ['Enter', 'Space'].forEach((key) => {
      it(`key: ${key} should toggle the Collapsible`, async () => {
        const { queryByText, getByRole, user } = await render(
          <Collapsible.Root defaultOpen={false} animated={false}>
            <Collapsible.Trigger>Trigger</Collapsible.Trigger>
            <Collapsible.Panel>This is content</Collapsible.Panel>
          </Collapsible.Root>,
        );

        const trigger = getByRole('button');
        const panel = queryByText('This is content');

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
        expect(trigger).not.to.have.attribute('data-panel-open');
        expect(panel).not.toBeVisible();
      });
    });
  });

  describe('prop: hiddenUntilFound', () => {
    it('uses `hidden="until-found" to hide panel when true', async function test(t = {}) {
      // we test firefox in browserstack which does not support this yet
      if (!('onbeforematch' in window) || /jsdom/.test(window.navigator.userAgent)) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
      }

      const handleOpenChange = spy();

      const { queryByText } = await render(
        <Collapsible.Root defaultOpen={false} animated={false} onOpenChange={handleOpenChange}>
          <Collapsible.Trigger />
          <Collapsible.Panel hiddenUntilFound>This is content</Collapsible.Panel>
        </Collapsible.Root>,
      );

      const panel = queryByText('This is content');

      act(() => {
        const event = new window.Event('beforematch', {
          bubbles: true,
          cancelable: false,
        });
        panel?.dispatchEvent(event);
      });

      expect(handleOpenChange.callCount).to.equal(1);
      expect(panel).to.have.attribute('data-open');
    });
  });
});
