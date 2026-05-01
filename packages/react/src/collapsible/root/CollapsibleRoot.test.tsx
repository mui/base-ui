import { expect, vi } from 'vitest';
import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { Collapsible } from '@base-ui/react/collapsible';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { REASONS } from '../../internals/reasons';

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

      expect(trigger).toHaveAttribute('aria-expanded');
      expect(trigger).toHaveAttribute('aria-controls');
      expect(trigger.getAttribute('aria-controls')).toBe(panel.getAttribute('id'));
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

      expect(trigger).toHaveAttribute('aria-controls', 'custom-panel-id');
      expect(panel).toHaveAttribute('id', 'custom-panel-id');
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

      expect(trigger).toHaveAttribute('data-disabled');
    });
  });

  describe('BaseUIChangeEventDetails', () => {
    it('calls onOpenChange with eventDetails', async () => {
      const handleOpenChange = vi.fn();

      const { user } = await render(
        <Collapsible.Root onOpenChange={handleOpenChange}>
          <Collapsible.Trigger>Toggle</Collapsible.Trigger>
          <Collapsible.Panel>{PANEL_CONTENT}</Collapsible.Panel>
        </Collapsible.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Toggle' });
      await user.click(trigger);

      expect(handleOpenChange.mock.calls.length).toBe(1);
      const [openArg, details] = handleOpenChange.mock.calls[0] as [boolean, any];
      expect(openArg).toBe(true);
      expect(details).not.toBe(undefined);
      expect(details.reason).toBe(REASONS.triggerPress);
      expect(details.event).toBeInstanceOf(MouseEvent);
      expect(details.isCanceled).toBe(false);
      expect(typeof details.cancel).toBe('function');
      expect(typeof details.allowPropagation).toBe('function');
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

      expect(trigger).not.toHaveAttribute('aria-controls');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText(PANEL_CONTENT)).toBe(null);

      await user.click(externalTrigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-controls');

      expect(screen.queryByText(PANEL_CONTENT)).not.toBe(null);
      expect(screen.queryByText(PANEL_CONTENT)).toBeVisible();
      expect(screen.queryByText(PANEL_CONTENT)).toHaveAttribute('data-open');
      expect(trigger).toHaveAttribute('data-panel-open');

      await user.click(externalTrigger);

      expect(trigger).not.toHaveAttribute('aria-controls');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText(PANEL_CONTENT)).toBe(null);
    });

    it('uncontrolled mode', async () => {
      const { user } = await render(
        <Collapsible.Root defaultOpen={false}>
          <Collapsible.Trigger />
          <Collapsible.Panel>This is panel content</Collapsible.Panel>
        </Collapsible.Root>,
      );

      const trigger = screen.getByRole('button');

      expect(trigger).not.toHaveAttribute('aria-controls');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText(PANEL_CONTENT)).toBe(null);

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-controls');
      expect(screen.queryByText(PANEL_CONTENT)).not.toBe(null);
      expect(screen.queryByText(PANEL_CONTENT)).toBeVisible();
      expect(screen.queryByText(PANEL_CONTENT)).toHaveAttribute('data-open');
      expect(trigger).toHaveAttribute('data-panel-open');

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).not.toHaveAttribute('aria-controls');
      expect(trigger).not.toHaveAttribute('data-panel-open');
      expect(screen.queryByText(PANEL_CONTENT)).toBe(null);
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

        expect(trigger).not.toHaveAttribute('aria-controls');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText(PANEL_CONTENT)).toBe(null);

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        await user.keyboard(`[${key}]`);

        expect(trigger).toHaveAttribute('aria-controls');
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(trigger).toHaveAttribute('data-panel-open');
        expect(screen.queryByText(PANEL_CONTENT)).toBeVisible();
        expect(screen.queryByText(PANEL_CONTENT)).not.toBe(null);
        expect(screen.queryByText(PANEL_CONTENT)).toHaveAttribute('data-open');

        await user.keyboard(`[${key}]`);

        expect(trigger).not.toHaveAttribute('aria-controls');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).not.toHaveAttribute('data-panel-open');
        expect(screen.queryByText(PANEL_CONTENT)).toBe(null);
      });
    });
  });
});
