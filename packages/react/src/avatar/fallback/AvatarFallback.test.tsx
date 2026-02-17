import * as React from 'react';
import { Mock } from 'vitest';
import { Avatar } from '@base-ui/react/avatar';
import { waitFor, screen } from '@mui/internal-test-utils';
import { describeConformance, createRenderer, isJSDOM } from '#test-utils';
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

  it.skipIf(!isJSDOM)('should not render the children if the image loaded', async () => {
    (useImageLoadingStatus as Mock).mockReturnValue('loaded');

    await render(
      <Avatar.Root>
        <Avatar.Image />
        <Avatar.Fallback data-testid="fallback" />
      </Avatar.Root>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('fallback')).to.equal(null);
    });
  });

  it.skipIf(!isJSDOM)('should render the fallback if the image fails to load', async () => {
    (useImageLoadingStatus as Mock).mockReturnValue('error');

    await render(
      <Avatar.Root>
        <Avatar.Image />
        <Avatar.Fallback>AC</Avatar.Fallback>
      </Avatar.Root>,
    );

    await waitFor(() => {
      expect(screen.queryByText('AC')).not.to.equal(null);
    });
  });

  describe.skipIf(!isJSDOM)('prop: delay', () => {
    const { clock, render: renderFakeTimers } = createRenderer();

    clock.withFakeTimers();

    it('shows the fallback when the delay has elapsed', async () => {
      await renderFakeTimers(
        <Avatar.Root>
          <Avatar.Image />
          <Avatar.Fallback delay={100}>AC</Avatar.Fallback>
        </Avatar.Root>,
      );

      expect(screen.queryByText('AC')).to.equal(null);

      clock.tick(100);

      expect(screen.queryByText('AC')).not.to.equal(null);
    });
  });

  it.skipIf(!isJSDOM)(
    'keeps fallback mounted and image unmounted while the image is loading',
    async () => {
      const useImageLoadingStatusMock = useImageLoadingStatus as Mock;
      useImageLoadingStatusMock.mockImplementation((src) => (src ? 'loading' : 'error'));

      function Test() {
        const [showImage, setShowImage] = React.useState(false);

        function handleShowImage() {
          setShowImage(true);
        }

        return (
          <div>
            <button onClick={handleShowImage}>Show image</button>
            <Avatar.Root>
              <Avatar.Image data-testid="image" src={showImage ? 'avatar.png' : undefined} />
              <Avatar.Fallback data-testid="fallback">AC</Avatar.Fallback>
            </Avatar.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      expect(screen.queryByTestId('image')).to.equal(null);
      expect(screen.getByTestId('fallback')).not.to.equal(null);

      await user.click(screen.getByText('Show image'));

      await waitFor(() => {
        expect(screen.queryByTestId('image')).to.equal(null);
        expect(screen.getByTestId('fallback')).not.to.equal(null);
      });
    },
  );

  describe.skipIf(isJSDOM)('regression', () => {
    afterEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    });

    it('keeps only one of image or fallback mounted when switching to image', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const useImageLoadingStatusMock = useImageLoadingStatus as Mock;
      useImageLoadingStatusMock.mockImplementation((src) => (src ? 'loaded' : 'error'));

      const style = `
        @keyframes test-exit {
          to {
            opacity: 0;
          }
        }

        .animation-test-fallback[data-ending-style] {
          animation: test-exit 2s;
        }
      `;

      function Test() {
        const [showImage, setShowImage] = React.useState(false);

        function handleShowImage() {
          setShowImage(true);
        }

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={handleShowImage}>Show image</button>
            <Avatar.Root>
              <Avatar.Image data-testid="image" src={showImage ? 'avatar.png' : undefined} />
              <Avatar.Fallback className="animation-test-fallback" data-testid="fallback">
                AC
              </Avatar.Fallback>
            </Avatar.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      expect(screen.queryByTestId('image')).to.equal(null);
      expect(screen.getByTestId('fallback')).not.to.equal(null);

      await user.click(screen.getByText('Show image'));

      await waitFor(() => {
        expect(screen.queryByTestId('image')).not.to.equal(null);
        expect(screen.queryByTestId('fallback')).to.equal(null);
      });
    });
  });
});
