import { expect, vi } from 'vitest';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { Field } from '@base-ui/react/field';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

vi.mock('@base-ui/utils/safeReact', async (importOriginal) => {
  const original = await importOriginal<typeof import('@base-ui/utils/safeReact')>();

  return {
    SafeReact: {
      ...original.SafeReact,
      captureOwnerStack: undefined,
      useId: undefined,
    },
  };
});

describe('<Field.Root /> with the React 17 id fallback', () => {
  const { render } = createRenderer();
  const { render: renderNonStrict } = createRenderer({ strict: false });

  it('falls back to a generated id when an explicit control id is removed', async () => {
    function TestCase() {
      const [explicit, setExplicit] = React.useState(true);

      return (
        <React.Fragment>
          <Field.Root>
            <Field.Label data-testid="label">Label</Field.Label>
            <Field.Control id={explicit ? 'custom' : undefined} />
          </Field.Root>
          <button type="button" onClick={() => setExplicit(false)}>
            clear
          </button>
        </React.Fragment>
      );
    }

    await renderNonStrict(<TestCase />);

    await waitFor(() => {
      expect(screen.getByTestId('label')).toHaveAttribute('for', 'custom');
    });

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('textbox').id).not.toBe('custom');
    });

    const control = screen.getByRole('textbox');

    expect(control.id).not.toBe('');
    expect(screen.getByTestId('label')).toHaveAttribute('for', control.id);
  });

  it('allows mount-time imperative validation before the fallback id is assigned', async () => {
    function TestCase() {
      const actionsRef = React.useRef<Field.Root.Actions>(null);

      useIsoLayoutEffect(() => {
        actionsRef.current?.validate();
      }, []);

      return (
        <Field.Root actionsRef={actionsRef} validate={() => 'Mount-time error'}>
          <Field.Error />
        </Field.Root>
      );
    }

    await render(<TestCase />);

    expect(await screen.findByText('Mount-time error')).toBeVisible();
  });

  it('reports label mismatches without the owner-stack API', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await render(
        <Field.Root>
          <Field.Label render={<div />}>Label</Field.Label>
        </Field.Root>,
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('<Field.Label> expected a <label> element'),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('reports non-native label mismatches without the owner-stack API', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await render(
        <Field.Root>
          <Field.Label nativeLabel={false}>Label</Field.Label>
        </Field.Root>,
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('<Field.Label> expected a non-<label> element'),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
