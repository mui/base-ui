import { expect } from 'chai';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { NonceProvider } from '@base-ui/react/nonce-provider';
import { createRenderer } from '#test-utils';

describe('<NonceProvider />', () => {
  const { render } = createRenderer();

  it('applies nonce to inline style tags rendered by components', async () => {
    await render(
      <NonceProvider nonce="test-nonce">
        <ScrollArea.Root>
          <ScrollArea.Viewport />
        </ScrollArea.Root>
      </NonceProvider>,
    );

    const styles = Array.from(document.querySelectorAll('style'));
    const style = styles.find((element) =>
      element.textContent?.includes('.base-ui-disable-scrollbar'),
    );
    expect(style).not.to.equal(null);
    expect(style).to.have.attribute('nonce', 'test-nonce');
  });
});
