'use client';
import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, act } from '@mui/internal-test-utils';
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
        <Collapsible.Root>
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
      const { getByTestId, getByRole, setProps } = await render(
        <Collapsible.Root open={false} animated={false}>
          <Collapsible.Trigger />
          <Collapsible.Panel data-testid="panel">This is content</Collapsible.Panel>
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');
      const panel = getByTestId('panel');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(panel).to.have.attribute('hidden');

      setProps({ open: true });

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(panel).to.not.have.attribute('hidden');
      expect(panel).to.have.attribute('data-open');

      setProps({ open: false });

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(panel).to.have.attribute('hidden');
    });

    it('uncontrolled mode', async () => {
      const { getByTestId, getByRole, user } = await render(
        <Collapsible.Root defaultOpen={false} animated={false}>
          <Collapsible.Trigger />
          <Collapsible.Panel data-testid="panel" />
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');
      const panel = getByTestId('panel');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(panel).to.have.attribute('hidden');

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(panel).to.not.have.attribute('hidden');
      expect(panel).to.have.attribute('data-open');

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(panel).to.have.attribute('hidden');
    });
  });

  describe('keyboard interactions', () => {
    ['Enter', 'Space'].forEach((key) => {
      it(`key: ${key} should toggle the Collapsible`, async () => {
        const { getByTestId, getByRole, user } = await render(
          <Collapsible.Root defaultOpen={false} animated={false}>
            <Collapsible.Trigger>Trigger</Collapsible.Trigger>
            <Collapsible.Panel data-testid="panel" />
          </Collapsible.Root>,
        );

        const trigger = getByRole('button');
        const panel = getByTestId('panel');

        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(panel).to.have.attribute('hidden');

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        await user.keyboard(`[${key}]`);

        expect(trigger).to.have.attribute('aria-expanded', 'true');
        expect(panel).to.not.have.attribute('hidden');
        expect(panel).to.have.attribute('data-open');

        await user.keyboard(`[${key}]`);

        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(panel).to.have.attribute('hidden');
      });
    });
  });

  describe('prop: hiddenUntilFound', () => {
    it('uses `hidden="until-found" to hide panel when true', async function test() {
      // we test firefox in browserstack which does not support this yet
      if (!('onbeforematch' in window)) {
        this.skip();
      }

      const handleOpenChange = spy();

      const { getByTestId } = await render(
        <Collapsible.Root defaultOpen={false} animated={false} onOpenChange={handleOpenChange}>
          <Collapsible.Trigger />
          <Collapsible.Panel data-testid="panel" hiddenUntilFound />
        </Collapsible.Root>,
      );

      const panel = getByTestId('panel');

      act(() => {
        const event = new window.Event('beforematch', {
          bubbles: true,
          cancelable: false,
        });
        panel.dispatchEvent(event);
      });

      expect(handleOpenChange.callCount).to.equal(1);
      expect(panel).to.have.attribute('data-open');
    });
  });
});
