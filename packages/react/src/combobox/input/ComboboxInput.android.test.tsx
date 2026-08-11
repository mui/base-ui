import { expect, vi } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer } from '#test-utils';
import { fireEvent, screen } from '@mui/internal-test-utils';

vi.mock('@base-ui/utils/platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@base-ui/utils/platform')>();
  return {
    ...actual,
    platform: {
      ...actual.platform,
      os: {
        ...actual.platform.os,
        android: true,
      },
    },
  };
});

describe('<Combobox.Input /> on Android', () => {
  const { render } = createRenderer();

  it('propagates changes during Android composition', async () => {
    const onInputValueChange = vi.fn();
    await render(
      <Combobox.Root onInputValueChange={onInputValueChange}>
        <Combobox.Input />
      </Combobox.Root>,
    );

    const input = screen.getByRole('combobox');
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: 'a' } });

    expect(onInputValueChange).toHaveBeenCalledWith('a', expect.anything());
  });
});
