import * as React from 'react';
import { expect, vi, describe, it } from 'vitest';
import { screen, waitFor } from '@mui/internal-test-utils';
import { Combobox } from '@base-ui/react/combobox';
import { reset } from '@base-ui/utils/warn';
import { createRenderer, setElementClientHeight } from '#test-utils';
import { Virtualizer } from './Virtualizer';

vi.mock('@base-ui/utils/safeReact', async (importOriginal) => {
  const original = await importOriginal<typeof import('@base-ui/utils/safeReact')>();

  return {
    SafeReact: {
      ...original.SafeReact,
      captureOwnerStack: undefined,
      useId: undefined,
    },
  };
});

interface TestGroup {
  label: string;
  items: string[];
}

const groups: TestGroup[] = [{ label: 'Group 1', items: ['Item 1', 'Item 2'] }];

function GroupedListbox() {
  return (
    <Virtualizer<string>
      enabled={false}
      estimatedItemHeight={20}
      items={groups}
      render={<div ref={setElementClientHeight(1000)} />}
      renderGroupHeader={(group: TestGroup, _, headerProps) => (
        <div {...headerProps}>{group.label}</div>
      )}
      role="listbox"
    >
      {(item, _, itemProps) => (
        <div {...itemProps} role="option" aria-selected={false}>
          {item}
        </div>
      )}
    </Virtualizer>
  );
}

describe('<Virtualizer /> grouped, with the React 17 id fallback', () => {
  const { render, renderToString } = createRenderer();

  it('withholds the group ids during SSR until the client fallback is assigned', () => {
    renderToString(<GroupedListbox />);

    // A stand-in id generated on the server would not match the client's and fail hydration.
    expect(screen.getByRole('group')).not.toHaveAttribute('aria-labelledby');
    expect(screen.getByText('Group 1')).not.toHaveAttribute('id');
  });

  it('names the group once the client id is assigned', async () => {
    await render(<GroupedListbox />);

    await waitFor(() => expect(screen.getByText('Group 1')).toHaveAttribute('id'));
    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-labelledby',
      screen.getByText('Group 1').id,
    );
  });
});

describe('<Combobox.GroupLabel /> in a virtualizer, with the React 17 id fallback', () => {
  const { renderToString } = createRenderer();

  it('does not report an id conflict while the virtualizer has no id yet', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // The message is logged once per process, so this run starts with a clear slate.
    reset();

    try {
      // Server rendering never runs the effect that assigns the client-side id, so the label's
      // own id can only be compared against the unresolved `undefined`.
      renderToString(
        <Combobox.Root defaultOpen items={groups}>
          <Combobox.List>
            <Virtualizer<string>
              enabled={false}
              estimatedItemHeight={20}
              renderGroupHeader={(group: TestGroup) => (
                <Combobox.GroupLabel id="custom">{group.label}</Combobox.GroupLabel>
              )}
            >
              {(item) => (
                <Combobox.Item key={item} value={item}>
                  {item}
                </Combobox.Item>
              )}
            </Virtualizer>
          </Combobox.List>
        </Combobox.Root>,
      );

      expect(screen.getByText('Group 1')).not.toBe(null);
      expect(warnSpy.mock.calls.map(([message]) => String(message)).join('\n')).not.toContain(
        'conflicts with the id provided by <Virtualizer>',
      );
    } finally {
      warnSpy.mockRestore();
    }
  });
});
