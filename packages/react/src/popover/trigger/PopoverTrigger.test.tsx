import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { createRenderer, describeConformance } from '#test-utils';
import { expect } from 'chai';
import { act, screen } from '@mui/internal-test-utils';

describe('<Popover.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(
        <Popover.Root open animated={false}>
          {node}
        </Popover.Root>,
      );
    },
  }));

  describe('style hooks', () => {
    it('should have the data-popup-open and data-pressed attributes when open by clicking', async () => {
      await render(
        <Popover.Root animated={false}>
          <Popover.Trigger />
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');

      await act(async () => {
        trigger.click();
      });

      expect(trigger).to.have.attribute('data-popup-open');
      expect(trigger).to.have.attribute('data-pressed');
    });

    it('should have the data-popup-open but not the data-pressed attribute when open by hover', async () => {
      const { user } = await render(
        <Popover.Root openOnHover delay={0} animated={false}>
          <Popover.Trigger />
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');

      await user.hover(trigger);

      expect(trigger).to.have.attribute('data-popup-open');
      expect(trigger).not.to.have.attribute('data-pressed');
    });

    it('should not have the data-popup-open and data-pressed attributes when open by click when `openOnHover=true` and `delay=0`', async () => {
      const { user } = await render(
        <Popover.Root delay={0} openOnHover animated={false}>
          <Popover.Trigger />
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');

      await user.hover(trigger);

      // Closes instantly after opening due to `useClick` prop `stickIfOpen=false`
      await act(async () => {
        trigger.click();
      });

      expect(trigger).not.to.have.attribute('data-popup-open');
      expect(trigger).not.to.have.attribute('data-pressed');
    });

    it('should have the data-popup-open and data-pressed attributes when open by click when `openOnHover=true`', async () => {
      const { user } = await render(
        <Popover.Root openOnHover animated={false}>
          <Popover.Trigger />
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button');

      await user.hover(trigger);
      await act(async () => {
        trigger.click();
      });

      expect(trigger).to.have.attribute('data-popup-open');
      expect(trigger).to.have.attribute('data-pressed');
    });
  });
});
