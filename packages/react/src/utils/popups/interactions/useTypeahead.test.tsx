import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { useTypeahead } from './useTypeahead';
import type { UseTypeaheadProps, UseTypeaheadReturnValue } from './useTypeahead';

const LABELS = ['ab', 'b', 'c'];

function List(
  props: Pick<UseTypeaheadProps, 'onMatch' | 'onTyping' | 'stopTypingKeys'> &
    Partial<Pick<UseTypeaheadProps, 'getLabel'>> & {
      actionsRef: React.RefObject<UseTypeaheadReturnValue | null>;
    },
) {
  const { actionsRef, getLabel = (index) => LABELS[index] ?? null, ...typeaheadProps } = props;
  const typeahead = useTypeahead({
    getLabel,
    getCount: () => LABELS.length,
    activeIndex: null,
    ...typeaheadProps,
  });
  React.useImperativeHandle(actionsRef, () => typeahead, [typeahead]);

  return <div role="listbox" tabIndex={0} onKeyDown={typeahead.onKeyDown} />;
}

describe('useTypeahead', () => {
  const { render } = createRenderer();

  function renderList(props: Partial<Pick<UseTypeaheadProps, 'stopTypingKeys' | 'getLabel'>> = {}) {
    const onMatch = vi.fn();
    const onTyping = vi.fn();
    const actionsRef = React.createRef<UseTypeaheadReturnValue>();
    return render(
      <List actionsRef={actionsRef} onMatch={onMatch} onTyping={onTyping} {...props} />,
    ).then(() => ({ onMatch, onTyping, actions: actionsRef.current! }));
  }

  function type(key: string) {
    const list = screen.getByRole('listbox');
    list.focus();
    fireEvent.keyDown(list, { key });
  }

  describe('prop: stopTypingKeys', () => {
    it.each([
      { name: 'stops', stopTypingKeys: true, reachesDocument: 0 },
      { name: 'does not stop', stopTypingKeys: false, reachesDocument: 1 },
    ])(
      '$name a typed key from reaching other handlers: $stopTypingKeys',
      async ({ stopTypingKeys, reachesDocument }) => {
        const handleDocumentKeyDown = vi.fn();
        document.addEventListener('keydown', handleDocumentKeyDown);

        try {
          await renderList({ stopTypingKeys });

          type('c');

          expect(handleDocumentKeyDown).toHaveBeenCalledTimes(reachesDocument);
        } finally {
          document.removeEventListener('keydown', handleDocumentKeyDown);
        }
      },
    );
  });

  describe('prop: getLabel', () => {
    it('stops reading labels at the first match', async () => {
      const getLabel = vi.fn((index: number) => LABELS[index] ?? null);
      await renderList({ getLabel });

      type('a');

      expect(getLabel).toHaveBeenCalledTimes(1);
    });
  });

  it('adds keys typed in quick succession to one search', async () => {
    const { onMatch } = await renderList();

    type('a');
    type('b');

    expect(onMatch.mock.calls.map(([index]) => index)).toEqual([0, 0]);
  });

  describe('endSession', () => {
    it('starts a new search with the next key', async () => {
      const { onMatch, actions } = await renderList();

      type('a');
      actions.endSession();
      type('b');

      expect(onMatch.mock.calls.map(([index]) => index)).toEqual([0, 1]);
    });

    it('reports that typing stopped', async () => {
      const { onTyping, actions } = await renderList();

      actions.endSession();

      expect(onTyping).toHaveBeenLastCalledWith(false);
    });
  });

  describe('reset', () => {
    it('starts a new search with the next key', async () => {
      const { onMatch, actions } = await renderList();

      type('a');
      actions.reset();
      type('b');

      expect(onMatch.mock.calls.map(([index]) => index)).toEqual([0, 1]);
    });

    it('reports that typing stopped when a search was in progress', async () => {
      const { onTyping, actions } = await renderList();

      type('a');
      onTyping.mockClear();
      actions.reset();

      expect(onTyping).toHaveBeenCalledTimes(1);
      expect(onTyping).toHaveBeenLastCalledWith(false);
    });

    it('does not report typing when no search was in progress', async () => {
      const { onTyping, actions } = await renderList();

      actions.reset();

      expect(onTyping).not.toHaveBeenCalled();
    });
  });
});
