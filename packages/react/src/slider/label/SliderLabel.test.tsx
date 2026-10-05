import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { describe, it, expect } from 'vitest';
import { Slider } from '@base-ui/react/slider';
import { Field } from '@base-ui/react/field';
import { screen, within } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Slider.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Slider.Label />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Slider.Root defaultValue={50}>
          {node}
          <Slider.Control>
            <Slider.Thumb />
          </Slider.Control>
        </Slider.Root>,
      );
    },
  }));

  it('focuses the registered thumb when composed within a Field', async () => {
    const { user } = await render(
      <Field.Root>
        <Slider.Root defaultValue={50}>
          <Slider.Label data-testid="label">Volume</Slider.Label>
          <Slider.Control>
            <input aria-label="Unrelated range" type="range" />
            <Slider.Thumb />
          </Slider.Control>
        </Slider.Root>
      </Field.Root>,
    );

    await user.click(screen.getByTestId('label'));

    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveFocus();
    expect(screen.getByRole('slider', { name: 'Unrelated range' })).not.toHaveFocus();
  });

  it('focuses the thumb in its shadow root when the outer document has a matching ID', async () => {
    const host = document.createElement('div');
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    shadowRoot.appendChild(container);
    document.body.appendChild(host);

    try {
      const { user, unmount } = await render(
        <React.Fragment>
          <input id="volume" aria-label="Unrelated control" />
          {ReactDOM.createPortal(
            <Field.Root>
              <Slider.Root defaultValue={50}>
                <Slider.Label>Volume</Slider.Label>
                <Slider.Control>
                  <Slider.Thumb id="volume" />
                </Slider.Control>
              </Slider.Root>
            </Field.Root>,
            container,
          )}
        </React.Fragment>,
      );

      try {
        const thumb = within(container).getByRole('slider', { name: 'Volume' });

        await user.click(within(container).getByText('Volume'));

        expect(shadowRoot.activeElement).toBe(thumb);
      } finally {
        unmount();
      }
    } finally {
      host.remove();
    }
  });

  it('does nothing when a Field slider has no thumb to focus', async () => {
    const { user } = await render(
      <Field.Root>
        <Slider.Root defaultValue={50}>
          <Slider.Label data-testid="label">Volume</Slider.Label>
          <Slider.Control />
        </Slider.Root>
      </Field.Root>,
    );

    await user.click(screen.getByTestId('label'));

    expect(document.body).toHaveFocus();
  });
});
