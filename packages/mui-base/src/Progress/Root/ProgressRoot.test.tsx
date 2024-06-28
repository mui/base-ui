import { expect } from 'chai';
import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Progress from '@base_ui/react/Progress';
import { describeConformance } from '../../../test/describeConformance';
import type { ProgressRootProps } from './ProgressRoot.types';

function TestProgress(props: ProgressRootProps) {
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
    inheritComponent: 'div',
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a progressbar', () => {
    const { getByRole } = render(
      <Progress.Root value={30}>
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress.Root>,
    );

    expect(getByRole('progressbar')).to.have.attribute('aria-valuenow', '30');
  });

  describe('ARIA attributes', () => {
    it('sets the correct aria attributes', () => {
      const { getByRole } = render(
        <Progress.Root value={30}>
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

    it('should update aria-valuenow when value changes', () => {
      const { getByRole, setProps } = render(<TestProgress value={50} />);
      const progressbar = getByRole('progressbar');
      setProps({ value: 77 });
      expect(progressbar).to.have.attribute('aria-valuenow', '77');
    });
  });
});
