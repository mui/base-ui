'use client';
import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, act, describeSkipIf } from '@mui/internal-test-utils';
import { Collapsible } from '@base_ui/react/Collapsible';
import { describeConformance } from '../../../test/describeConformance';

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
          <Collapsible.Content data-testid="content" />
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');
      const content = getByTestId('content');

      expect(trigger).to.have.attribute('aria-expanded');

      expect(trigger.getAttribute('aria-controls')).to.equal(content.getAttribute('id'));
    });
  });

  describe('open state', () => {
    it('controlled mode', async () => {
      const { getByTestId, getByRole, setProps } = await render(
        <Collapsible.Root open={false} animated={false}>
          <Collapsible.Trigger />
          <Collapsible.Content data-testid="content" />
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');
      const content = getByTestId('content');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(content).to.have.attribute('hidden');
      expect(content).to.have.attribute('data-closed', '');

      setProps({ open: true });

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(content).to.not.have.attribute('hidden');
      expect(content).to.have.attribute('data-open', '');

      setProps({ open: false });

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(content).to.have.attribute('data-closed', '');
      expect(content).to.have.attribute('hidden');
    });

    it('uncontrolled mode', async function test(t = {}) {
      if (/jsdom/.test(window.navigator.userAgent)) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
      }

      const { getByTestId, getByRole, user } = await render(
        <Collapsible.Root defaultOpen={false} animated={false}>
          <Collapsible.Trigger />
          <Collapsible.Content data-testid="content" />
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');
      const content = getByTestId('content');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(content).to.have.attribute('hidden');
      expect(content).to.have.attribute('data-closed', '');

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(content).to.not.have.attribute('hidden');
      expect(content).to.have.attribute('data-open', '');

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(content).to.have.attribute('data-closed', '');
      expect(content).to.have.attribute('hidden');
    });
  });

  describeSkipIf(/jsdom/.test(window.navigator.userAgent))('keyboard interactions', () => {
    ['Enter', 'Space'].forEach((key) => {
      it(`key: ${key} should toggle the Collapsible`, async () => {
        const { getByTestId, getByRole, user } = await render(
          <Collapsible.Root defaultOpen={false} animated={false}>
            <Collapsible.Trigger>Trigger</Collapsible.Trigger>
            <Collapsible.Content data-testid="content" />
          </Collapsible.Root>,
        );

        const trigger = getByRole('button');
        const content = getByTestId('content');

        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(content).to.have.attribute('hidden');
        expect(content).to.have.attribute('data-closed', '');

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        await user.keyboard(`[${key}]`);

        expect(trigger).to.have.attribute('aria-expanded', 'true');
        expect(content).to.not.have.attribute('hidden');
        expect(content).to.have.attribute('data-open', '');

        await user.keyboard(`[${key}]`);

        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(content).to.have.attribute('data-closed', '');
        expect(content).to.have.attribute('hidden');
      });
    });
  });

  describe('prop: htmlHidden', () => {
    it('supports "hidden until found" state', async function test(t = {}) {
      // we test firefox in browserstack which does not support this yet
      if (!('onbeforematch' in window) || /jsdom/.test(window.navigator.userAgent)) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
      }

      const handleOpenChange = spy();

      const { getByTestId } = await render(
        <Collapsible.Root defaultOpen={false} animated={false} onOpenChange={handleOpenChange}>
          <Collapsible.Trigger />
          <Collapsible.Content data-testid="content" htmlHidden="until-found" />
        </Collapsible.Root>,
      );

      const content = getByTestId('content');

      expect(content).to.have.attribute('data-closed', '');

      act(() => {
        const event = new window.Event('beforematch', {
          bubbles: true,
          cancelable: false,
        });
        content.dispatchEvent(event);
      });

      expect(handleOpenChange.callCount).to.equal(1);
      expect(content).to.have.attribute('data-open', '');
    });
  });
});
