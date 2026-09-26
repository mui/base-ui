import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { Combobox } from '@base-ui/react/combobox';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { createRenderer } from '#test-utils';
import { REASONS } from '../../internals/reasons';

describe.each([
  ['Combobox', Combobox],
  ['Autocomplete', Autocomplete],
] as const)('%s internal dismiss labels', (_name, Parts) => {
  const { render } = createRenderer();

  function TestComponent({
    label,
    inside = false,
    onOpenChange,
  }: {
    label?: string | undefined;
    inside?: boolean;
    onOpenChange?: (open: boolean, details: { reason: string }) => void;
  }) {
    const children = (
      <React.Fragment>
        {inside ? <Parts.Trigger>Open</Parts.Trigger> : <Parts.Input aria-label="Fruit" />}
        <Parts.Portal>
          <Parts.Positioner>
            <Parts.Popup>
              {inside && <Parts.Input aria-label="Fruit" />}
              <Parts.List>
                {(item: string) => (
                  <Parts.Item key={item} value={item}>
                    {item}
                  </Parts.Item>
                )}
              </Parts.List>
            </Parts.Popup>
          </Parts.Positioner>
        </Parts.Portal>
      </React.Fragment>
    );
    const rootProps = {
      defaultOpen: true,
      modal: inside,
      items: ['Apple', 'Banana'],
      dismissButtonLabel: label,
      onOpenChange,
      children,
    };
    return _name === 'Combobox' ? (
      <Combobox.Root {...rootProps} />
    ) : (
      <Autocomplete.Root {...rootProps} />
    );
  }

  it.each([false, true])(
    'updates both labels without remounting (input inside: %s)',
    async (inside) => {
      const { rerender } = await render(<TestComponent inside={inside} label="Fermer" />);

      const buttons = screen.getAllByRole('button', { name: 'Fermer' });
      expect(buttons).toHaveLength(2);
      expect(screen.queryByRole('button', { name: 'Dismiss' })).toBe(null);

      await rerender(<TestComponent inside={inside} label="닫기" />);

      expect(screen.getAllByRole('button', { name: '닫기' })).toEqual(buttons);
      expect(screen.queryByRole('button', { name: 'Fermer' })).toBe(null);
      expect(screen.getByRole('listbox')).toBeVisible();

      await rerender(<TestComponent inside={inside} />);

      expect(screen.getAllByRole('button', { name: 'Dismiss' })).toEqual(buttons);
    },
  );

  it.each([0, 1])(
    'dismisses through localized button %s with the existing close reason',
    async (index) => {
      const onOpenChange = vi.fn();
      await render(<TestComponent label="닫기" onOpenChange={onOpenChange} />);

      const button = screen.getAllByRole('button', { name: '닫기' })[index];
      expect(button).not.toHaveAttribute('tabindex');

      // Screen readers activate the hidden control without a preceding pointer press.
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).toBe(null);
      });
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(
        false,
        expect.objectContaining({ reason: REASONS.closePress }),
      );
    },
  );
});
