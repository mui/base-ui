import { expect } from 'vitest';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { Select } from '@base-ui/react/select';
import { CSPProvider } from '@base-ui/react/csp-provider';
import { createRenderer } from '#test-utils';

function queryDisableScrollbarStyle() {
  const styles = Array.from(document.querySelectorAll('style'));
  return (
    styles.find((element) => element.textContent?.includes('.base-ui-disable-scrollbar')) ?? null
  );
}

describe('<CSPProvider />', () => {
  const { render } = createRenderer();

  afterEach(() => {
    document.querySelectorAll('style').forEach((element) => {
      element.remove();
    });
  });

  it('applies nonce to inline style tags rendered by components', async () => {
    await render(
      <CSPProvider nonce="test-nonce">
        <ScrollArea.Root>
          <ScrollArea.Viewport />
        </ScrollArea.Root>
      </CSPProvider>,
    );

    const style = queryDisableScrollbarStyle();
    expect(style).not.toBeNull();
    expect(style).toHaveAttribute('nonce', 'test-nonce');
  });

  it('does not render inline style tags when disableStyleElements is true', async () => {
    await render(
      <CSPProvider disableStyleElements>
        <ScrollArea.Root>
          <ScrollArea.Viewport />
        </ScrollArea.Root>
      </CSPProvider>,
    );

    expect(queryDisableScrollbarStyle()).toBeNull();
  });

  it('does not render Select inline style tags when disableStyleElements is true', async () => {
    await render(
      <CSPProvider disableStyleElements>
        <Select.Root defaultOpen>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </CSPProvider>,
    );

    expect(queryDisableScrollbarStyle()).toBeNull();
  });
});
