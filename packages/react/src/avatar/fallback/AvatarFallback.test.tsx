import * as React from 'react';
import { Avatar } from '@base-ui-components/react/avatar';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Avatar.Fallback />', () => {
  const { render } = createRenderer();

  describeConformance(<Avatar.Fallback />, () => ({
    render: (node) => {
      return render(<Avatar.Root>{node}</Avatar.Root>);
    },
    refInstanceof: window.HTMLSpanElement,
  }));

  it('should not render the children if the image loaded', async () => {
    vi.mock('../image/useImageLoadingStatus', () => ({
      useImageLoadingStatus: () => 'loaded',
    }));

    const { queryAllByTestId } = await render(
      <Avatar.Root>
        <Avatar.Image />
        <Avatar.Fallback data-testid="fallback" />
      </Avatar.Root>,
    );

    expect(queryAllByTestId('fallback').length).toEqual(0);
  });
});
