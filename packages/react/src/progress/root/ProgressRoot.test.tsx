import * as React from 'react';
import { expect } from 'chai';
import { Progress } from '@base-ui-components/react/progress';
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

  it('renders a progressbar', async () => {
    const { getByRole } = await render(
      <Progress.Root value={30}>
        <Progress.Value />
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress.Root>,
    );

    expect(getByRole('progressbar')).to.have.attribute('aria-valuenow', '30');
  });

  describe('ARIA attributes', () => {
    it('sets the correct aria attributes', async () => {
      const { getByRole } = await render(
        <Progress.Root value={30}>
          <Progress.Value />
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>,
      );

      const progressbar = getByRole('progressbar');

      expect(progressbar).to.have.attribute('aria-valuenow', '30');
      expect(progressbar).to.have.attribute('aria-valuemin', '0');
      expect(progressbar).to.have.attribute('aria-valuemax', '100');
      expect(progressbar).to.have.attribute('aria-valuetext', '30%');
    });

    it('should update aria-valuenow when value changes', async () => {
      const { getByRole, setProps } = await render(<TestProgress value={50} />);
      const progressbar = getByRole('progressbar');
      setProps({ value: 77 });
      expect(progressbar).to.have.attribute('aria-valuenow', '77');
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
      const { getByRole, getByTestId } = await render(
        <Progress.Root value={30} format={format}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>,
      );
      const value = getByTestId('value');
      const progressbar = getByRole('progressbar');
      expect(value).to.have.text(formatValue(30));
      expect(progressbar).to.have.attribute('aria-valuetext', formatValue(30));
    });
  });
});
