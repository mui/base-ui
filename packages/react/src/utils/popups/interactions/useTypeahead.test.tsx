import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { useTypeahead } from './useTypeahead';
import type { UseTypeaheadProps, UseTypeaheadReturnValue } from './useTypeahead';

const LABELS = ['ab', 'b', 'c'];

function List(
  props: Pick<UseTypeaheadProps, 'onMatch' | 'onTyping' | 'enabled'> & {
    actionsRef: React.RefObject<UseTypeaheadReturnValue | null>;
  },
) {
  const { actionsRef, ...typeaheadProps } = props;
  const typeahead = useTypeahead({
    getLabel: (index) => LABELS[index] ?? null,
    getCount: () => LABELS.length,
    activeIndex: null,
    ...typeaheadProps,
  });
  React.useImperativeHandle(actionsRef, () => typeahead, [typeahead]);

  return <div role="listbox" tabIndex={0} onKeyDown={typeahead.onKeyDown} />;
}

describe('useTypeahead', () => {
  const { render } = createRenderer();

  function renderList(props: Pick<UseTypeaheadProps, 'enabled'> = {}) {
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

  describe('prop: enabled', () => {
    it.each([
      { name: 'matches', state: 'enabled', enabled: true, calls: 1 },
      { name: 'does not match', state: 'disabled', enabled: false, calls: 0 },
    ])('$name typed keys when $state', async ({ enabled, calls }) => {
      const { onMatch } = await renderList({ enabled });

      type('c');

      expect(onMatch).toHaveBeenCalledTimes(calls);
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
