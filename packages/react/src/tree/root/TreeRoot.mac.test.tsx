import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent } from '@mui/internal-test-utils';
import { describeTree } from '../../../test/describeTree';

vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');
  return { platform: { ...actual.platform, os: { ...actual.platform.os, mac: true } } };
});

describeTree('TreeRoot - Keyboard on macOS', ({ render }) => {
  describe('opt-in multiple selection', () => {
    it('moves focus without moving the selection on Option+arrow keys', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        multiple: 'opt-in',
        defaultSelectedItems: ['1'],
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      fireEvent.keyDown(view.getItemRoot('1'), { key: 'ArrowDown', altKey: true });
      expect(view.getFocusedItemId()).toBe('2');
      expect(view.getSelectedTreeItems()).toEqual(['1']);

      fireEvent.keyDown(view.getItemRoot('2'), { key: 'ArrowDown' });
      expect(view.getSelectedTreeItems()).toEqual(['3']);
    });

    it.each([
      { name: 'a space', key: ' ' },
      { name: 'a non-breaking space', key: ' ' },
    ])('toggles the focused item on Option+Space reported as $name', async ({ key }) => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        multiple: 'opt-in',
        defaultSelectedItems: ['1'],
      });

      act(() => {
        view.getItemRoot('2').focus();
      });
      fireEvent.keyDown(view.getItemRoot('2'), { key, code: 'Space', altKey: true });
      expect(view.getSelectedTreeItems()).toEqual(['1', '2']);

      fireEvent.keyDown(view.getItemRoot('2'), { key, code: 'Space', altKey: true });
      expect(view.getSelectedTreeItems()).toEqual(['1']);
    });

    it('toggles the focused item on Option+Space while a type-ahead query is in progress', async () => {
      const view = await render({
        items: [
          { id: '1', label: 'Alpha' },
          { id: '2', label: 'Beta' },
        ],
        multiple: 'opt-in',
        defaultSelectedItems: ['1'],
      });

      act(() => {
        view.getItemRoot('1').focus();
      });
      fireEvent.keyDown(view.getItemRoot('1'), { key: 'b' });
      expect(view.getFocusedItemId()).toBe('2');
      expect(view.getSelectedTreeItems()).toEqual(['2']);

      fireEvent.keyDown(view.getItemRoot('2'), { key: '\u00a0', code: 'Space', altKey: true });
      expect(view.getSelectedTreeItems()).toEqual([]);
    });

    it('ignores auto-repeat of Option+Space', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        multiple: 'opt-in',
        defaultSelectedItems: ['1'],
      });

      act(() => {
        view.getItemRoot('2').focus();
      });
      fireEvent.keyDown(view.getItemRoot('2'), { key: ' ', code: 'Space', altKey: true });
      expect(view.getSelectedTreeItems()).toEqual(['1', '2']);

      fireEvent.keyDown(view.getItemRoot('2'), {
        key: ' ',
        code: 'Space',
        altKey: true,
        repeat: true,
      });
      expect(view.getSelectedTreeItems()).toEqual(['1', '2']);
    });
  });
});
