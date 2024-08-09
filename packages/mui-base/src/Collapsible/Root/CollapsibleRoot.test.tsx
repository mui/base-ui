import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '@mui/internal-test-utils';
import * as Collapsible from '@base_ui/react/Collapsible';

describe('<Collapsible.Root />', () => {
  const { render } = createRenderer();

  describe('ARIA attributes', () => {
    it('sets ARIA attributes', async () => {
      const { getByTestId, getByRole } = await render(
        <Collapsible.Root>
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
        <Collapsible.Root open={false}>
          <Collapsible.Trigger />
          <Collapsible.Content data-testid="content" />
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');
      const content = getByTestId('content');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(content).to.have.attribute('hidden');
      expect(content).to.have.attribute('data-state', 'closed');

      setProps({ open: true });

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(content).to.not.have.attribute('hidden');
      expect(content).to.have.attribute('data-state', 'open');

      setProps({ open: false });

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(content).to.have.attribute('data-state', 'closed');
    });

    it('uncontrolled mode', async () => {
      const { getByTestId, getByRole, user } = await render(
        <Collapsible.Root defaultOpen={false}>
          <Collapsible.Trigger />
          <Collapsible.Content data-testid="content" />
        </Collapsible.Root>,
      );

      const trigger = getByRole('button');
      const content = getByTestId('content');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(content).to.have.attribute('hidden');
      expect(content).to.have.attribute('data-state', 'closed');

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'true');
      expect(content).to.not.have.attribute('hidden');
      expect(content).to.have.attribute('data-state', 'open');

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(content).to.have.attribute('data-state', 'closed');
    });
  });

  describe('keyboard interactions', () => {
    ['Enter', 'Space'].forEach((key) => {
      it(`key: ${key} should toggle the Collapsible`, async () => {
        const { getByTestId, getByRole, user } = await render(
          <Collapsible.Root defaultOpen={false}>
            <Collapsible.Trigger>Trigger</Collapsible.Trigger>
            <Collapsible.Content data-testid="content" />
          </Collapsible.Root>,
        );

        const trigger = getByRole('button');
        const content = getByTestId('content');

        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(content).to.have.attribute('hidden');
        expect(content).to.have.attribute('data-state', 'closed');

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        await user.keyboard(`[${key}]`);

        expect(trigger).to.have.attribute('aria-expanded', 'true');
        expect(content).to.not.have.attribute('hidden');
        expect(content).to.have.attribute('data-state', 'open');

        await user.keyboard(`[${key}]`);

        expect(trigger).to.have.attribute('aria-expanded', 'false');
        expect(content).to.have.attribute('data-state', 'closed');
      });
    });
  });
});
