import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
import { Meter } from '@base-ui/react/meter';
import { createRenderer, describeConformance, mockRuntimeLocale } from '#test-utils';

describe('<Meter.Value />', () => {
  const { render, renderToString } = createRenderer();

  describeConformance(<Meter.Value />, () => ({
    render: (node) => {
      return render(<Meter.Root value={30}>{node}</Meter.Root>);
    },
    refInstanceof: window.HTMLSpanElement,
  }));

  describe('prop: children', () => {
    it('renders the value when children is not provided', async () => {
      await render(
        <Meter.Root value={30}>
          <Meter.Value data-testid="value" />
        </Meter.Root>,
      );

      const value = screen.getByTestId('value');
      expect(value.textContent).toBe((0.3).toLocaleString(undefined, { style: 'percent' }));
    });

    it('renders a formatted value when a format is provided', async () => {
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
      };
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v);
      }

      await render(
        <Meter.Root value={30} format={format}>
          <Meter.Value data-testid="value" />
        </Meter.Root>,
      );

      const value = screen.getByTestId('value');
      expect(value.textContent).toBe(formatValue(30));
    });

    it('accepts a render function', async () => {
      const renderSpy = vi.fn();
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
      };
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v);
      }
      await render(
        <Meter.Root value={30} format={format}>
          <Meter.Value data-testid="value">{renderSpy}</Meter.Value>
        </Meter.Root>,
      );
      expect(renderSpy.mock.lastCall?.[0]).toEqual(formatValue(30));
      expect(renderSpy.mock.lastCall?.[1]).toEqual(30);
    });

    it('passes updated arguments to the render function when value changes', async () => {
      const renderSpy = vi.fn();

      const { setProps } = await render(
        <Meter.Root value={30}>
          <Meter.Value>{renderSpy}</Meter.Value>
        </Meter.Root>,
      );

      expect(renderSpy.mock.lastCall?.[0]).toEqual(
        (0.3).toLocaleString(undefined, { style: 'percent' }),
      );
      expect(renderSpy.mock.lastCall?.[1]).toEqual(30);

      await setProps({ value: 60 });

      expect(renderSpy.mock.lastCall?.[0]).toEqual(
        (0.6).toLocaleString(undefined, { style: 'percent' }),
      );
      expect(renderSpy.mock.lastCall?.[1]).toEqual(60);
    });
  });

  describe('server-side rendering', () => {
    it.each([
      { name: 'directly inside Root', suspense: false },
      { name: 'inside a Suspense boundary', suspense: true },
    ])('hydrates $name without a mismatch, then uses the runtime locale', async ({ suspense }) => {
      // Options no other test here formats with; see `mockRuntimeLocale`.
      const format = { maximumFractionDigits: 1 };
      mockRuntimeLocale('de-DE');
      const valueElement = <Meter.Value data-testid="value" />;

      const { hydrate } = await renderToString(
        <Meter.Root value={1234.5} max={2000} format={format}>
          {suspense ? (
            <React.Suspense fallback={null}>{valueElement}</React.Suspense>
          ) : (
            valueElement
          )}
        </Meter.Root>,
      );
      const value = screen.getByTestId('value');
      expect(value.textContent).toBe((1234.5).toLocaleString('en-US', format));

      await hydrate();
      // A mismatch makes React discard the server markup and render new nodes.
      expect(screen.getByTestId('value')).toBe(value);
      expect(value.textContent).toBe((1234.5).toLocaleString('de-DE', format));
    });
  });
});
