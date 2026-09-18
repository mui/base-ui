// @vitest-environment jsdom

import * as React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@mui/internal-test-utils';
// eslint-disable-next-line import/no-relative-packages
import { createDndRenderer } from '../../../packages/react/test/dndEngine';
// eslint-disable-next-line import/no-relative-packages
import { firePointer } from '../../../packages/react/test/pointer';
// eslint-disable-next-line import/no-relative-packages
import { setupDragEngineTests } from '../../../packages/react/test/dnd';
import ActivationCss from '../app/(docs)/react/utils/draggable/demos/activation/css-modules';
import ActivationTailwind from '../app/(docs)/react/utils/draggable/demos/activation/tailwind';
import FileExplorerCss from '../app/(docs)/react/utils/draggable/demos/examples/file-explorer/css-modules';
import FileExplorerTailwind from '../app/(docs)/react/utils/draggable/demos/examples/file-explorer/tailwind';

setupDragEngineTests();

describe('draggable demos', () => {
  const { renderDnd } = createDndRenderer();

  describe.each([
    ['CSS Modules', ActivationCss],
    ['Tailwind', ActivationTailwind],
  ] as const)('activation with %s', (_name, Demo) => {
    it.each(['touch', 'pen'])(
      'keeps the dragging status on a %s double-tap',
      async (pointerType) => {
        await renderDnd(<Demo />);
        fireEvent.click(screen.getByRole('button', { name: 'Double-click' }));
        const source = screen.getByLabelText('Puck');
        source.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100);
        const pointer = { pointerType, pointerId: 1, button: 0, clientX: 20, clientY: 20 };
        firePointer.down(source, { ...pointer, buttons: 1, timeStamp: 100 });
        firePointer.up(source, { ...pointer, buttons: 0, timeStamp: 150 });
        firePointer.down(source, { ...pointer, buttons: 1, timeStamp: 200 });
        expect(screen.getByRole('status')).toHaveTextContent('Move to the target');
        firePointer.up(source, { ...pointer, buttons: 0, timeStamp: 250 });
      },
    );
  });

  describe.each([
    ['CSS Modules', FileExplorerCss],
    ['Tailwind', FileExplorerTailwind],
  ] as const)('file explorer with %s', (_name, Demo) => {
    it.each(['{Enter}', ' '])('opens a folder with %s after tabbing to it', async (key) => {
      const { user } = await renderDnd(<Demo />);
      const folder = screen.getByRole('button', { name: 'Archive' });
      expect(folder).toHaveAttribute('tabindex', '0');
      // The Home breadcrumb is the first tab stop.
      await user.tab();
      await user.tab();
      expect(folder).toHaveFocus();
      await user.keyboard(key);
      expect(screen.getByText('backup-2024.zip')).toBeVisible();
      expect(screen.queryByText('budget.xlsx')).toBeNull();
    });
  });
});
