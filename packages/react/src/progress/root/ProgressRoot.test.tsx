import { expect } from 'chai';
import * as React from 'react';
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
});
