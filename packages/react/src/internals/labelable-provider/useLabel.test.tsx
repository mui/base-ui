import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { describe, expect, it } from 'vitest';
import { act, screen, within } from '@mui/internal-test-utils';
import { Select } from '@base-ui/react/select';
import { Combobox } from '@base-ui/react/combobox';
import { Field } from '@base-ui/react/field';
import { createRenderer } from '#test-utils';
import { useLabel } from './useLabel';

describe('useLabel', () => {
  const { render } = createRenderer();

  describe.each(['Select.Label', 'Combobox.Label', 'Field.Label'])('%s', (labelType) => {
    function TestControl() {
      if (labelType === 'Combobox.Label') {
        return (
          <Field.Root name="country">
            <Combobox.Root>
              <Combobox.Label>Country</Combobox.Label>
              <Combobox.Trigger id="country">Choose a country</Combobox.Trigger>
              <Combobox.Portal>
                <Combobox.Positioner>
                  <Combobox.Popup>
                    <Combobox.Input aria-label="Search countries" />
                    <Combobox.List>
                      <Combobox.Item value="fr">France</Combobox.Item>
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
          </Field.Root>
        );
      }

      return (
        <Field.Root name="country">
          {labelType === 'Field.Label' && (
            <Field.Label nativeLabel={false} render={<div />}>
              Country
            </Field.Label>
          )}
          <Select.Root>
            {labelType === 'Select.Label' && <Select.Label>Country</Select.Label>}
            <Select.Trigger id="country">Choose a country</Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.List>
                    <Select.Item value="fr">
                      <Select.ItemText>France</Select.ItemText>
                    </Select.Item>
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Field.Root>
      );
    }

    it('focuses the trigger without opening the popup in the document', async () => {
      const { user } = await render(<TestControl />);
      const trigger = screen.getByRole('combobox', { name: 'Country' });

      await user.click(screen.getByText('Country'));

      expect(trigger).toHaveFocus();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it.each([false, true])(
      'focuses the trigger in its shadow root without opening the popup (outer matching ID: %s)',
      async (outerMatchingId) => {
        const host = document.createElement('div');
        const shadowRoot = host.attachShadow({ mode: 'open' });
        const container = document.createElement('div');
        shadowRoot.appendChild(container);
        document.body.appendChild(host);

        try {
          const { user, unmount } = await render(
            <React.Fragment>
              {outerMatchingId && <input id="country" aria-label="Unrelated control" />}
              {ReactDOM.createPortal(<TestControl />, container)}
            </React.Fragment>,
          );

          try {
            const trigger = within(container).getByRole('combobox', { name: 'Country' });

            await user.click(within(container).getByText('Country'));

            expect(shadowRoot.activeElement).toBe(trigger);
            expect(document.activeElement).toBe(host);
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
          } finally {
            unmount();
          }
        } finally {
          host.remove();
        }
      },
    );
  });

  it('preserves native label activation inside a shadow root', async () => {
    const host = document.createElement('div');
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    shadowRoot.appendChild(container);
    document.body.appendChild(host);

    try {
      const { user, unmount } = await render(
        <Field.Root>
          <Field.Label>Name</Field.Label>
          <Field.Control />
        </Field.Root>,
        { container },
      );

      try {
        const control = within(container).getByRole('textbox', { name: 'Name' });

        await user.click(within(container).getByText('Name'));

        expect(shadowRoot.activeElement).toBe(control);
      } finally {
        unmount();
      }
    } finally {
      host.remove();
    }
  });

  it('focuses a control in the light DOM from a label in a shadow root', async () => {
    const host = document.createElement('div');
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    shadowRoot.appendChild(container);
    document.body.appendChild(host);

    try {
      const { user, unmount } = await render(
        <Combobox.Root>
          {ReactDOM.createPortal(<Combobox.Label>Country</Combobox.Label>, container)}
          <Combobox.Trigger id="country">Choose a country</Combobox.Trigger>
        </Combobox.Root>,
      );

      try {
        await user.click(within(container).getByText('Country'));

        expect(screen.getByRole('combobox')).toHaveFocus();
      } finally {
        unmount();
      }
    } finally {
      host.remove();
    }
  });

  it('does not throw when a label is clicked in a detached React root', async () => {
    const container = document.createElement('div');

    const { unmount } = await render(
      <Field.Root>
        <Field.Label nativeLabel={false} render={<div />}>
          Country
        </Field.Label>
        <Select.Root>
          <Select.Trigger id="country">Choose a country</Select.Trigger>
        </Select.Root>
      </Field.Root>,
      { container },
    );

    const errors: ErrorEvent[] = [];
    function handleError(event: ErrorEvent) {
      event.preventDefault();
      errors.push(event);
    }
    window.addEventListener('error', handleError);

    try {
      await act(async () => {
        within(container).getByText('Country').click();
      });

      expect(errors).toHaveLength(0);
    } finally {
      window.removeEventListener('error', handleError);
      unmount();
    }
  });

  it('does not focus the control when a composed click originates inside a nested button', async () => {
    function Test() {
      const labelProps = useLabel({ fallbackControlId: 'control' });
      const hostRef = React.useCallback((host: HTMLSpanElement | null) => {
        if (host && !host.shadowRoot) {
          const target = document.createElement('span');
          target.dataset.testid = 'shadow-target';
          host.attachShadow({ mode: 'open' }).appendChild(target);
        }
      }, []);

      return (
        <React.Fragment>
          <div {...labelProps}>
            Label
            <button type="button">
              Action
              <span ref={hostRef} />
            </button>
          </div>
          <input id="control" />
        </React.Fragment>
      );
    }

    await render(<Test />);

    const button = screen.getByRole('button');
    const target = button.querySelector('span')?.shadowRoot?.querySelector('span');
    const control = screen.getByRole('textbox');

    expect(target).not.toBeNull();

    await act(async () => {
      target?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    });

    expect(control).not.toHaveFocus();
  });
});
