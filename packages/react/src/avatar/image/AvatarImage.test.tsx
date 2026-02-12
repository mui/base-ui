import * as React from 'react';
import { Mock } from 'vitest';
import { Avatar } from '@base-ui/react/avatar';
import { screen, waitFor } from '@mui/internal-test-utils';
import { describeConformance, createRenderer, isJSDOM } from '#test-utils';
import { useImageLoadingStatus } from './useImageLoadingStatus';

vi.mock('./useImageLoadingStatus');

describe('<Avatar.Image />', () => {
  const { render } = createRenderer();

  const useImageLoadingStatusMock = useImageLoadingStatus as Mock;

  beforeEach(() => {
    useImageLoadingStatusMock.mockReturnValue('loaded');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describeConformance(<Avatar.Image />, () => ({
    render: (node) => {
      return render(<Avatar.Root>{node}</Avatar.Root>);
    },
    refInstanceof: window.HTMLImageElement,
  }));

  describe.skipIf(isJSDOM)('animations', () => {
    afterEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    });

    it('triggers enter animation via data-starting-style when mounting', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      useImageLoadingStatusMock.mockImplementation((src) => (src ? 'loaded' : 'idle'));

      let transitionFinished = false;
      function notifyTransitionFinished() {
        transitionFinished = true;
      }

      const style = `
        .animation-test-image {
          transition: opacity 1ms;
        }

        .animation-test-image[data-starting-style],
        .animation-test-image[data-ending-style] {
          opacity: 0;
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
              <Avatar.Image
                className="animation-test-image"
                data-testid="image"
                onTransitionEnd={notifyTransitionFinished}
                src={showImage ? 'avatar.png' : undefined}
              />
            </Avatar.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);
      expect(screen.queryByTestId('image')).to.equal(null);

      await user.click(screen.getByText('Show image'));

      await waitFor(() => {
        expect(transitionFinished).to.equal(true);
      });

      expect(screen.getByTestId('image')).not.to.equal(null);
    });

    it('applies data-ending-style before unmount', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      useImageLoadingStatusMock.mockImplementation((src) => (src ? 'loaded' : 'idle'));

      const style = `
        @keyframes test-anim {
          to {
            opacity: 0;
          }
        }

        .animation-test-image[data-ending-style] {
          animation: test-anim 1ms;
        }
      `;

      function Test() {
        const [showImage, setShowImage] = React.useState(true);

        function handleHideImage() {
          setShowImage(false);
        }

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={handleHideImage}>Hide image</button>
            <Avatar.Root>
              <Avatar.Image
                className="animation-test-image"
                data-testid="image"
                src={showImage ? 'avatar.png' : undefined}
              />
            </Avatar.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);
      expect(screen.getByTestId('image')).not.to.equal(null);

      await user.click(screen.getByText('Hide image'));

      await waitFor(() => {
        const image = screen.queryByTestId('image');
        expect(image).not.to.equal(null);
        expect(image).to.have.attribute('data-ending-style');
      });

      await waitFor(() => {
        expect(screen.queryByTestId('image')).to.equal(null);
      });
    });
  });
});
