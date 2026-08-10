import * as React from 'react';
import { expect } from 'vitest';
import { act, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { useLabel } from './useLabel';

describe('useLabel', () => {
  const { render } = createRenderer();

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
