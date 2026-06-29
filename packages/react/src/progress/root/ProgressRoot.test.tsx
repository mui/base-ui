import { expect } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { Progress } from '@base-ui/react/progress';
import { createRenderer, describeConformance } from '#test-utils';
import type { ProgressRoot } from './ProgressRoot';

function TestProgress(props: ProgressRoot.Props) {
  return (
    <Progress.Root {...props}>
      <Progress.Track>
        <Progress.Indicator />
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
      expect(value).toHaveTextContent(formatValue(30));
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
      expect(value).toHaveTextContent(formatValue(30, usd));

      await setProps({ format: eur });
      expect(value).toHaveTextContent(formatValue(30, eur));
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
