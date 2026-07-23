import { expect, vi } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { Progress } from '@base-ui/react/progress';
import { createRenderer, describeConformance } from '#test-utils';
import type { ProgressRoot } from './ProgressRoot';

function formatPercent(value: number) {
  return value.toLocaleString(undefined, { style: 'percent' });
}

function TestProgress(props: ProgressRoot.Props) {
  return (
    <Progress.Root {...props}>
      <Progress.Label data-testid="label">Upload progress</Progress.Label>
      <Progress.Value data-testid="value" />
      <Progress.Track data-testid="track">
        <Progress.Indicator data-testid="indicator" />
      </Progress.Track>
    </Progress.Root>
  );
}

describe('<Progress.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Progress.Root value={50} />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  describe('ARIA attributes', () => {
    it('sets the correct aria attributes', async () => {
      await render(
        <Progress.Root value={30}>
          <Progress.Label>Downloading</Progress.Label>
          <Progress.Value />
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>,
      );

      const progressbar = screen.getByRole('progressbar');
      const label = screen.getByText('Downloading');

      expect(progressbar).toHaveAttribute('aria-valuenow', '30');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
      expect(progressbar).toHaveAttribute(
        'aria-valuetext',
        (0.3).toLocaleString(undefined, { style: 'percent' }),
      );
      expect(progressbar.getAttribute('aria-labelledby')).toBe(label.getAttribute('id'));
    });

    it('should update aria-valuenow when value changes', async () => {
      const { setProps } = await render(<TestProgress value={50} />);
      const progressbar = screen.getByRole('progressbar');
      await setProps({ value: 77 });
      expect(progressbar).toHaveAttribute('aria-valuenow', '77');
    });
  });

  describe('data attributes', () => {
    it('keeps every composed part synchronized through the status cycle', async () => {
      const { setProps } = await render(<TestProgress value={null} />);
      const progressbar = screen.getByRole('progressbar');
      const value = screen.getByTestId('value');
      const indicator = screen.getByTestId('indicator');
      const parts = [
        progressbar,
        screen.getByTestId('label'),
        value,
        screen.getByTestId('track'),
        indicator,
      ];

      parts.forEach((part) => {
        expect(part).toHaveAttribute('data-indeterminate');
        expect(part).not.toHaveAttribute('data-progressing');
        expect(part).not.toHaveAttribute('data-complete');
      });
      expect(progressbar).not.toHaveAttribute('aria-valuenow');
      expect(progressbar).toHaveAttribute('aria-valuetext', 'indeterminate progress');
      expect(value).toBeEmptyDOMElement();
      expect(indicator.style.width).toBe('');

      await setProps({ value: 50 });
      parts.forEach((part) => {
        expect(part).not.toHaveAttribute('data-indeterminate');
        expect(part).toHaveAttribute('data-progressing');
        expect(part).not.toHaveAttribute('data-complete');
      });
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
      expect(value).toHaveTextContent(formatPercent(0.5));
      expect(indicator.style.width).toBe('50%');

      await setProps({ value: 100 });
      parts.forEach((part) => {
        expect(part).not.toHaveAttribute('data-indeterminate');
        expect(part).not.toHaveAttribute('data-progressing');
        expect(part).toHaveAttribute('data-complete');
      });
      expect(progressbar).toHaveAttribute('aria-valuenow', '100');
      expect(value).toHaveTextContent(formatPercent(1));
      expect(indicator.style.width).toBe('100%');

      await setProps({ value: null });
      parts.forEach((part) => {
        expect(part).toHaveAttribute('data-indeterminate');
        expect(part).not.toHaveAttribute('data-progressing');
        expect(part).not.toHaveAttribute('data-complete');
      });
      expect(progressbar).not.toHaveAttribute('aria-valuenow');
      expect(progressbar).toHaveAttribute('aria-valuetext', 'indeterminate progress');
      expect(value).toBeEmptyDOMElement();
      expect(indicator.style.width).toBe('');
    });
  });

  describe('range', () => {
    it('normalizes the formatted value, aria-valuetext, and indicator within a custom range', async () => {
      const expected = (0.5).toLocaleString(undefined, { style: 'percent' });

      await render(
        <Progress.Root min={20} max={40} value={30}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>,
      );

      const progressbar = screen.getByRole('progressbar');
      expect(screen.getByTestId('indicator').style.width).toBe('50%');
      expect(screen.getByTestId('value')).toHaveTextContent(expected);
      expect(progressbar).toHaveAttribute('aria-valuetext', expected);
    });

    it('clamps aria-valuenow, the value text, and the indicator when the value overshoots max', async () => {
      const expected = (1).toLocaleString(undefined, { style: 'percent' });

      await render(
        <Progress.Root min={0} max={40} value={50}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>,
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '40');
      expect(progressbar).toHaveAttribute('aria-valuemax', '40');
      expect(progressbar).toHaveAttribute('aria-valuetext', expected);
      expect(screen.getByTestId('value')).toHaveTextContent(expected);
      expect(screen.getByTestId('indicator').style.width).toBe('100%');
    });

    it('clamps aria-valuenow, the value text, and the indicator when the value undershoots min', async () => {
      const expected = (0).toLocaleString(undefined, { style: 'percent' });

      await render(
        <Progress.Root min={20} max={40} value={10}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>,
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '20');
      expect(progressbar).toHaveAttribute('aria-valuemin', '20');
      expect(progressbar).toHaveAttribute('aria-valuetext', expected);
      expect(screen.getByTestId('value')).toHaveTextContent(expected);
      expect(screen.getByTestId('indicator').style.width).toBe('0%');
    });

    it('reports complete when the value reaches or exceeds max', async () => {
      await render(
        <Progress.Root min={0} max={40} value={45}>
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>,
      );

      expect(screen.getByRole('progressbar')).toHaveAttribute('data-complete');
    });

    it('normalizes aria attributes when min equals max', async () => {
      const expected = (0).toLocaleString(undefined, { style: 'percent' });

      await render(
        <Progress.Root min={5} max={5} value={5}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>,
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '5');
      expect(progressbar).toHaveAttribute('aria-valuetext', expected);
      expect(screen.getByTestId('value')).toHaveTextContent(expected);
      expect(screen.getByTestId('indicator').style.width).toBe('0%');
    });

    it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
      'keeps non-finite value %s indeterminate',
      async (value) => {
        await render(<TestProgress value={value} />);

        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toHaveAttribute('data-indeterminate');
        expect(progressbar).not.toHaveAttribute('aria-valuenow');
        expect(progressbar).toHaveAttribute('aria-valuetext', 'indeterminate progress');
        expect(screen.getByTestId('value')).toBeEmptyDOMElement();
        expect(screen.getByTestId('indicator').style.width).toBe('');
      },
    );
  });

  describe('prop: getAriaValueText', () => {
    it('receives the formatted and raw values for determinate and indeterminate states', async () => {
      const getAriaValueText = vi.fn((formattedValue: string | null, value: number | null) =>
        value == null ? 'Waiting to start' : `${formattedValue} uploaded`,
      );

      const { setProps } = await render(
        <Progress.Root value={30} getAriaValueText={getAriaValueText}>
          <Progress.Value data-testid="value" />
        </Progress.Root>,
      );

      const progressbar = screen.getByRole('progressbar');
      const formattedValue = formatPercent(0.3);
      expect(getAriaValueText).toHaveBeenLastCalledWith(formattedValue, 30);
      expect(progressbar).toHaveAttribute('aria-valuetext', `${formattedValue} uploaded`);
      expect(screen.getByTestId('value')).toHaveTextContent(formattedValue);

      await setProps({ value: null });

      expect(getAriaValueText).toHaveBeenLastCalledWith('', null);
      expect(progressbar).toHaveAttribute('aria-valuetext', 'Waiting to start');
      expect(screen.getByTestId('value')).toBeEmptyDOMElement();
    });
  });

  describe('prop: format', () => {
    it('formats the value', async () => {
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
      };
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v);
      }

      await render(
        <Progress.Root value={30} format={format}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>,
      );

      const value = screen.getByTestId('value');
      const progressbar = screen.getByRole('progressbar');
      expect(value.textContent).toBe(formatValue(30));
      expect(progressbar).toHaveAttribute('aria-valuetext', formatValue(30));
    });

    it('reflects format changes without lagging a commit', async () => {
      const usd: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' };
      const eur: Intl.NumberFormatOptions = { style: 'currency', currency: 'EUR' };
      function formatValue(v: number, options: Intl.NumberFormatOptions) {
        return new Intl.NumberFormat(undefined, options).format(v);
      }

      const { setProps } = await render(
        <Progress.Root value={30} format={usd}>
          <Progress.Value data-testid="value" />
        </Progress.Root>,
      );

      const value = screen.getByTestId('value');
      expect(value.textContent).toBe(formatValue(30, usd));

      await setProps({ format: eur });
      expect(value.textContent).toBe(formatValue(30, eur));
    });
  });

  describe('prop: locale', () => {
    it('sets the locale when formatting the value', async () => {
      // In German locale, numbers use dot as thousands separator and comma as decimal separator
      const expectedValue = new Intl.NumberFormat('de-DE').format(70.51);

      await render(
        <Progress.Root
          value={70.51}
          format={{
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }}
          locale="de-DE"
        >
          <Progress.Value data-testid="value" />
        </Progress.Root>,
      );

      expect(screen.getByTestId('value')).toHaveTextContent(expectedValue);
    });
  });
});
