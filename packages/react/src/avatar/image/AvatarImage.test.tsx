import { Avatar } from '@base-ui/react/avatar';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Avatar.Image />', () => {
  const { render } = createRenderer();
  vi.mock('./useImageLoadingStatus', () => ({
    useImageLoadingStatus: () => 'loaded',
  }));

  describeConformance(<Avatar.Image />, () => ({
    render: (node) => {
      return render(<Avatar.Root>{node}</Avatar.Root>);
    },
    refInstanceof: window.HTMLImageElement,
  }));
});
