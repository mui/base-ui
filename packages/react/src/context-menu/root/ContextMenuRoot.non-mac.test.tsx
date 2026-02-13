import { expect } from 'chai';
import {
  fireEvent,
  ignoreActWarnings,
  reactMajor,
  screen,
  waitFor,
} from '@mui/internal-test-utils';
import { spy } from 'sinon';
import { vi } from 'vitest';
import { ContextMenu } from '@base-ui/react/context-menu';
import { createRenderer } from '#test-utils';

vi.mock('@base-ui/utils/detectBrowser', async () => {
  const actual = await vi.importActual<typeof import('@base-ui/utils/detectBrowser')>(
    '@base-ui/utils/detectBrowser',
  );

  return {
    ...actual,
    isMac: false,
  };
});

describe('<ContextMenu.Root /> (non-Mac)', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render, clock } = createRenderer({
    clockOptions: {
      shouldAdvanceTime: true,
    },
  });

  describe('interactions', () => {
    clock.withFakeTimers();

    it('ignores context menu mouseup on non-Mac platforms', async () => {
      if (reactMajor <= 18) {
        ignoreActWarnings();
      }

      const onOpenChange = spy();

      await render(
        <ContextMenu.Root onOpenChange={onOpenChange}>
          <ContextMenu.Trigger data-testid="context-trigger">Surface</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner alignOffset={0}>
              <ContextMenu.Popup data-testid="context-popup">
                <ContextMenu.Item data-testid="context-item">Action</ContextMenu.Item>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>,
      );

      const trigger = screen.getByTestId('context-trigger');

      fireEvent.contextMenu(trigger, { clientX: 12, clientY: 12, button: 2 });

      await screen.findByTestId('context-popup');
      const item = screen.getByTestId('context-item');

      fireEvent.pointerMove(document.body, { clientX: 24, clientY: 24 });
      fireEvent.mouseUp(item, { button: 2, clientX: 24, clientY: 24 });

      await waitFor(() => {
        expect(screen.queryByTestId('context-popup')).not.to.equal(null);
      });

      expect(onOpenChange.callCount).to.equal(1);
    });
  });
});
