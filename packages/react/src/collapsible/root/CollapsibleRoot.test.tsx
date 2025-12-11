'use client';
import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { Collapsible } from '@base-ui/react/collapsible';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { spy } from 'sinon';
import { REASONS } from '../../utils/reasons';

const PANEL_CONTENT = 'This is panel content';

describe('<Collapsible.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Collapsible.Root />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  describe('ARIA attributes', () => {
    it('sets ARIA attributes', async () => {
      await render(
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger />
          <Collapsible.Panel data-testid="panel" />
        </Collapsible.Root>,
      );

      const trigger = screen.getByRole('button');
      const panel = screen.getByTestId('panel');

      expect(trigger).to.have.attribute('aria-expanded');
      expect(trigger).to.have.attribute('aria-controls');
      expect(trigger.getAttribute('aria-controls')).to.equal(panel.getAttribute('id'));
    });

    it('references manual panel id in trigger aria-controls', async () => {
      await render(
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger />
          <Collapsible.Panel id="custom-panel-id" data-testid="panel" />
        </Collapsible.Root>,
      );

      const trigger = screen.getByRole('button');
      const panel = screen.getByTestId('panel');

      expect(trigger).to.have.attribute('aria-controls', 'custom-panel-id');
      expect(panel).to.have.attribute('id', 'custom-panel-id');
    });
  });

  describe('collapsible status', () => {
    it('disabled status', async () => {
      await render(
        <Collapsible.Root disabled>
          <Collapsible.Trigger />
          <Collapsible.Panel data-testid="panel" />
        </Collapsible.Root>,
      );

      const trigger = screen.getByRole('button');

      expect(trigger).to.have.attribute('data-disabled');
    });
  });

  describe('BaseUIChangeEventDetails', () => {
    it('calls onOpenChange with eventDetails', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <Collapsible.Root onOpenChange={handleOpenChange}>
          <Collapsible.Trigger>Toggle</Collapsible.Trigger>
          <Collapsible.Panel>{PANEL_CONTENT}</Collapsible.Panel>
        </Collapsible.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Toggle' });
      await user.click(trigger);

      expect(handleOpenChange.callCount).to.equal(1);
      const [openArg, details] = handleOpenChange.firstCall.args as [boolean, any];
      expect(openArg).to.equal(true);
      expect(details).to.not.equal(undefined);
      expect(details.reason).to.equal(REASONS.triggerPress);
      expect(details.event).to.be.instanceOf(MouseEvent);
      expect(details.isCanceled).to.equal(false);
      expect(typeof details.cancel).to.equal('function');
      expect(typeof details.allowPropagation).to.equal('function');
    });
  });

  describe.skipIf(isJSDOM)('open state', () => {
    it('controlled mode', async () => {
      function App() {
        const [open, setOpen] = React.useState(false);
        return (
          <React.Fragment>
            <Collapsible.Root open={open}>
              <Collapsible.Trigger>trigger</Collapsible.Trigger>
              <Collapsible.Panel>This is panel content</Collapsible.Panel>
            </Collapsible.Root>
            <button type="button" onClick={() => setOpen(!open)}>
              toggle
            </button>
          </React.Fragment>
        );
      }
      const { user } = await render(<App />);

      const externalTrigger = screen.getByRole('button', { name: 'toggle' });
      const trigger = screen.getByRole('button', { name: 'trigger' });

      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(screen.queryByText(PANEL_CONTENT)).to.equal(null);

      await user.click(externalTrigger);

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(trigger).to.have.attribute('aria-controls');

      expect(screen.queryByText(PANEL_CONTENT)).not.to.equal(null);
      expect(screen.queryByText(PANEL_CONTENT)).toBeVisible();
      expect(screen.queryByText(PANEL_CONTENT)).to.have.attribute('data-open');
      expect(trigger).to.have.attribute('data-panel-open');

      await user.click(externalTrigger);

      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(screen.queryByText(PANEL_CONTENT)).to.equal(null);
    });

    it('uncontrolled mode', async () => {
      const { user } = await render(
        <Collapsible.Root defaultOpen={false}>
          <Collapsible.Trigger />
          <Collapsible.Panel>This is panel content</Collapsible.Panel>
        </Collapsible.Root>,
      );

      const trigger = screen.getByRole('button');

      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(screen.queryByText(PANEL_CONTENT)).to.equal(null);

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(trigger).to.have.attribute('aria-controls');
      expect(screen.queryByText(PANEL_CONTENT)).not.to.equal(null);
      expect(screen.queryByText(PANEL_CONTENT)).toBeVisible();
      expect(screen.queryByText(PANEL_CONTENT)).to.have.attribute('data-open');
      expect(trigger).to.have.attribute('data-panel-open');

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(trigger).to.not.have.attribute('aria-controls');
      expect(trigger).to.not.have.attribute('data-panel-open');
      expect(screen.queryByText(PANEL_CONTENT)).to.equal(null);
    });
  });

  describe.skipIf(isJSDOM)('keyboard interactions', () => {
    ['Enter', 'Space'].forEach((key) => {
      it(`key: ${key} should toggle the Collapsible`, async () => {
        const { user } = await render(
          <Collapsible.Root defaultOpen={false}>
            <Collapsible.Trigger>Trigger</Collapsible.Trigger>
            <Collapsible.Panel>This is panel content</Collapsible.Panel>
          </Collapsible.Root>,
        );

        const trigger = screen.getByRole('button');

        expect(trigger).to.not.have.attribute('aria-controls');
        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(screen.queryByText(PANEL_CONTENT)).to.equal(null);

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        await user.keyboard(`[${key}]`);

        expect(trigger).to.have.attribute('aria-controls');
        expect(trigger).to.have.attribute('aria-expanded', 'true');
        expect(trigger).to.have.attribute('data-panel-open');
        expect(screen.queryByText(PANEL_CONTENT)).toBeVisible();
        expect(screen.queryByText(PANEL_CONTENT)).not.to.equal(null);
        expect(screen.queryByText(PANEL_CONTENT)).to.have.attribute('data-open');

        await user.keyboard(`[${key}]`);

        expect(trigger).to.not.have.attribute('aria-controls');
        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(trigger).not.to.have.attribute('data-panel-open');
        expect(screen.queryByText(PANEL_CONTENT)).to.equal(null);
      });
    });
  });
});
