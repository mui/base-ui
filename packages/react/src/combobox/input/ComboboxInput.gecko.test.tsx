import { expect, vi } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { createRenderer } from '#test-utils';
import { screen } from '@mui/internal-test-utils';

vi.mock('@base-ui/utils/platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@base-ui/utils/platform')>();
  return {
    ...actual,
    platform: {
      ...actual.platform,
      engine: {
        ...actual.platform.engine,
        gecko: true,
      },
    },
  };
});

describe('<Combobox.Input /> in Gecko RTL', () => {
  const { render } = createRenderer();

  it('uses Gecko RTL caret positions for Home and End', async () => {
    const { user } = await render(
      <DirectionProvider direction="rtl">
        <Combobox.Root defaultInputValue="apple">
          <Combobox.Input />
        </Combobox.Root>
      </DirectionProvider>,
    );

    const input = screen.getByRole<HTMLInputElement>('combobox');
    input.focus();

    await user.keyboard('{Home}');
    expect(input.selectionStart).toBe(input.value.length);

    await user.keyboard('{End}');
    expect(input.selectionStart).toBe(0);
  });
});
