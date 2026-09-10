import { expect, describe, it, afterEach } from 'vitest';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { isJSDOM } from './testUtils';
import { visuallyHidden, visuallyHiddenInput } from './visuallyHidden';

describe('visuallyHidden', () => {
  const { render } = createRenderer();

  afterEach(() => {
    document.documentElement.removeAttribute('dir');
  });

  it('pins the fixed variant with logical insets instead of a physical left offset', () => {
    expect(visuallyHidden.position).toBe('fixed');
    expect(visuallyHidden.left).toBeUndefined();
    expect(visuallyHidden.top).toBeUndefined();
    expect(visuallyHidden.insetInlineStart).toBe(0);
    expect(visuallyHidden.insetBlockStart).toBe(0);
    expect(visuallyHidden.clipPath).toBe('inset(50%)');
    expect(visuallyHidden.overflow).toBe('hidden');
  });

  it('keeps the named-input variant absolutely positioned without offsets', () => {
    expect(visuallyHiddenInput.position).toBe('absolute');
    expect(visuallyHiddenInput.left).toBeUndefined();
    expect(visuallyHiddenInput.top).toBeUndefined();
    expect(visuallyHiddenInput.insetInlineStart).toBeUndefined();
    expect(visuallyHiddenInput.insetBlockStart).toBeUndefined();
    expect(visuallyHiddenInput.clipPath).toBe('inset(50%)');
    expect(visuallyHiddenInput.overflow).toBe('hidden');
  });

  it.skipIf(isJSDOM)(
    'does not overflow the viewport on the physical left under dir=rtl',
    async () => {
      document.documentElement.dir = 'rtl';

      await render(<input data-testid="hidden" style={visuallyHidden} />);

      expect(screen.getByTestId('hidden').getBoundingClientRect().left).toBeGreaterThanOrEqual(0);
    },
  );
});
