import * as React from 'react';
import { Mock } from 'vitest';
import { Avatar } from '@base-ui-components/react/avatar';
import { describeConformance, createRenderer } from '#test-utils';
import { useImageLoadingStatus } from '../image/useImageLoadingStatus';

vi.mock('../image/useImageLoadingStatus');

describe('<Avatar.Fallback />', () => {
  const { render } = createRenderer();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describeConformance(<Avatar.Fallback />, () => ({
    render: (node) => {
      return render(<Avatar.Root>{node}</Avatar.Root>);
    },
    refInstanceof: window.HTMLSpanElement,
  }));

  it('should not render the children if the image loaded', async () => {
    (useImageLoadingStatus as Mock).mockReturnValue('loaded');

    const { queryByTestId } = await render(
      <Avatar.Root>
        <Avatar.Image />
        <Avatar.Fallback data-testid="fallback" />
      </Avatar.Root>,
    );

    expect(queryByTestId('fallback')).to.equal(null);
  });

  it('should render the fallback if the image fails to load', async () => {
    (useImageLoadingStatus as Mock).mockReturnValue('error');

    const { queryByText } = await render(
      <Avatar.Root>
        <Avatar.Image />
        <Avatar.Fallback>AC</Avatar.Fallback>
      </Avatar.Root>,
    );

    expect(queryByText('AC')).to.not.equal(null);
  });

  describe('prop: delay', () => {
    const { clock, render: renderFakeTimers } = createRenderer();

    clock.withFakeTimers();

    it('shows the fallback when the delay has elapsed', async () => {
      const { queryByText } = await renderFakeTimers(
        <Avatar.Root>
          <Avatar.Image />
          <Avatar.Fallback delay={100}>AC</Avatar.Fallback>
        </Avatar.Root>,
      );

      expect(queryByText('AC')).to.equal(null);

      clock.tick(100);

      expect(queryByText('AC')).to.not.equal(null);
    });
  });
});
