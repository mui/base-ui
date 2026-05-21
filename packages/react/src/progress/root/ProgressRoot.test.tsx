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

    it('updates aria-valuenow when value changes', async () => {
      const { setProps } = await render(<TestProgress value={50} />);
      const progressbar = screen.getByRole('progressbar');
      await setProps({ value: 77 });
      expect(progressbar).toHaveAttribute('aria-valuenow', '77');
    });
  });

  describe('state attributes', () => {
    it('indicates progressing, complete, and indeterminate states', async () => {
      const { setProps } = await render(<TestProgress value={50} />);
      const progressbar = screen.getByRole('progressbar');

      expect(progressbar).toHaveAttribute('data-progressing', '');
      expect(progressbar).not.toHaveAttribute('data-complete');
      expect(progressbar).not.toHaveAttribute('data-indeterminate');

      await setProps({ value: 100 });

      expect(progressbar).toHaveAttribute('data-complete', '');
      expect(progressbar).not.toHaveAttribute('data-progressing');
      expect(progressbar).not.toHaveAttribute('data-indeterminate');

      await setProps({ value: null });

      expect(progressbar).toHaveAttribute('data-indeterminate', '');
      expect(progressbar).not.toHaveAttribute('data-complete');
      expect(progressbar).not.toHaveAttribute('data-progressing');
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
