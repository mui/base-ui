import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { createRenderer, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { Fieldset } from '@base-ui/react/fieldset';
import { describeConformance, isJSDOM } from '#test-utils';

describe('<Fieldset.Legend />', () => {
  const { render, renderToString } = createRenderer();

  describeConformance(<Fieldset.Legend />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Fieldset.Root>{node}</Fieldset.Root>);
    },
  }));

  it('should set aria-labelledby on the fieldset automatically', () => {
    render(
      <Fieldset.Root>
        <Fieldset.Legend data-testid="legend">Legend</Fieldset.Legend>
      </Fieldset.Root>,
    );

    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-labelledby',
      screen.getByTestId('legend').id,
    );
  });

  it('should set aria-labelledby on the fieldset with custom id', () => {
    render(
      <Fieldset.Root>
        <Fieldset.Legend id="legend-id" />
      </Fieldset.Root>,
    );

    expect(screen.getByRole('group')).toHaveAttribute('aria-labelledby', 'legend-id');
  });

  it('updates and clears the legend association', async () => {
    function App() {
      const [legendId, setLegendId] = React.useState('legend-a');
      const [showLegend, setShowLegend] = React.useState(true);

      return (
        <React.Fragment>
          <Fieldset.Root>
            {showLegend ? <Fieldset.Legend id={legendId}>Legend</Fieldset.Legend> : null}
          </Fieldset.Root>
          <button type="button" onClick={() => setLegendId('legend-b')}>
            Change id
          </button>
          <button type="button" onClick={() => setShowLegend(false)}>
            Remove legend
          </button>
        </React.Fragment>
      );
    }

    render(<App />);

    expect(screen.getByRole('group')).toHaveAttribute('aria-labelledby', 'legend-a');
    fireEvent.click(screen.getByRole('button', { name: 'Change id' }));
    expect(screen.getByRole('group')).toHaveAttribute('aria-labelledby', 'legend-b');
    fireEvent.click(screen.getByRole('button', { name: 'Remove legend' }));
    expect(screen.getByRole('group')).not.toHaveAttribute('aria-labelledby');
  });

  it('throws a descriptive error when rendered outside <Fieldset.Root>', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      expect(() => render(<Fieldset.Legend />)).toThrow(
        'Base UI: FieldsetRootContext is missing. Fieldset parts must be placed within <Fieldset.Root>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  // The root reserves the legend's id up front so server markup is already labelled. Without a
  // legend that reservation is dropped once registration settles on the client.
  it.skipIf(isJSDOM)('drops `aria-labelledby` after hydration when legend is absent', async () => {
    const { hydrate } = renderToString(<Fieldset.Root data-testid="fieldset" />);

    hydrate();

    await waitFor(() => {
      expect(screen.getByTestId('fieldset')).not.toHaveAttribute('aria-labelledby');
    });
  });

  it.skipIf(isJSDOM)(
    'keeps `aria-labelledby` associated during SSR without a custom legend id',
    async () => {
      const { hydrate } = renderToString(
        <Fieldset.Root data-testid="fieldset">
          <Fieldset.Legend data-testid="legend">Legend</Fieldset.Legend>
        </Fieldset.Root>,
      );

      const fieldset = screen.getByTestId('fieldset');
      const legend = screen.getByTestId('legend');

      expect(legend.id).not.toBe('');
      expect(fieldset).toHaveAttribute('aria-labelledby', legend.id);

      hydrate();

      await waitFor(() => {
        expect(screen.getByTestId('fieldset')).toHaveAttribute(
          'aria-labelledby',
          screen.getByTestId('legend').id,
        );
      });
      expect(screen.getByTestId('legend').id).toBe(legend.id);
    },
  );

  // An explicit `id` only reaches the DOM once registration runs, so the server markup carries
  // the root's reserved id on both the fieldset and the legend. Rendering `id` right away would
  // instead leave `aria-labelledby` pointing at nothing until hydration.
  it.skipIf(isJSDOM)(
    'defers an explicit legend id until hydration but keeps the fieldset associated during SSR',
    async () => {
      const { hydrate } = renderToString(
        <Fieldset.Root data-testid="fieldset">
          <Fieldset.Legend id="explicit" data-testid="legend">
            Legend
          </Fieldset.Legend>
        </Fieldset.Root>,
      );

      const legend = screen.getByTestId('legend');
      expect(legend.id).not.toBe('');
      expect(legend).not.toHaveAttribute('id', 'explicit');
      expect(screen.getByTestId('fieldset')).toHaveAttribute('aria-labelledby', legend.id);

      hydrate();

      await waitFor(() => {
        expect(screen.getByTestId('legend')).toHaveAttribute('id', 'explicit');
      });
      expect(screen.getByTestId('fieldset')).toHaveAttribute('aria-labelledby', 'explicit');
    },
  );
});
