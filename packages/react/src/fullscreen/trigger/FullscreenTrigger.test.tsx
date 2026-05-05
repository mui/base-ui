import { expect } from 'vitest';
import * as React from 'react';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { Fullscreen } from '@base-ui/react/fullscreen';
import { createRenderer, describeConformance } from '#test-utils';
import { installFullscreenApiStubs, type FullscreenApiStubs } from '../root/fullscreenApiTestUtils';

describe('<Fullscreen.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Fullscreen.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render: (node) => {
      return render(<Fullscreen.Root>{node}</Fullscreen.Root>);
    },
  }));

  describe('ARIA attributes', () => {
    let stubs: FullscreenApiStubs;

    beforeEach(() => {
      stubs = installFullscreenApiStubs();
    });

    afterEach(() => {
      stubs.restore();
    });

    it('points aria-controls at the container element', async () => {
      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container data-testid="container" />
        </Fullscreen.Root>,
      );

      const trigger = screen.getByRole('button');
      const container = screen.getByTestId('container');

      expect(trigger).toHaveAttribute('aria-controls', container.getAttribute('id'));
      expect(trigger).toHaveAttribute('aria-pressed', 'false');
    });

    it('honors a manual `id` on the container', async () => {
      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container id="custom-fullscreen" />
        </Fullscreen.Root>,
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'custom-fullscreen');
    });
  });

  describe('data attributes', () => {
    let stubs: FullscreenApiStubs;

    beforeEach(() => {
      stubs = installFullscreenApiStubs();
    });

    afterEach(() => {
      stubs.restore();
    });

    it('reflects the fullscreen state with `data-fullscreen` and `data-not-fullscreen`', async () => {
      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container />
        </Fullscreen.Root>,
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('data-not-fullscreen');
      expect(trigger).not.toHaveAttribute('data-fullscreen');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute('data-fullscreen');
      expect(trigger).not.toHaveAttribute('data-not-fullscreen');
    });
  });
});
