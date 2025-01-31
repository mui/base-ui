import * as React from 'react';
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
    useImageLoadingStatus.mockReturnValue('loaded');

    const { queryByTestId } = await render(
      <Avatar.Root>
        <Avatar.Image />
        <Avatar.Fallback data-testid="fallback" />
      </Avatar.Root>,
    );

    expect(queryByTestId('fallback')).to.equal(null);
  });

  it('should render the fallback if the image fails to load', async () => {
    useImageLoadingStatus.mockReturnValue('error');

    const { queryByText } = await render(
      <Avatar.Root>
        <Avatar.Image />
        <Avatar.Fallback>AC</Avatar.Fallback>
      </Avatar.Root>,
    );

    expect(queryByText('AC')).to.not.equal(null);
  });
});
