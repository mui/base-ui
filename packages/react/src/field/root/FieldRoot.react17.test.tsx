import { expect, vi } from 'vitest';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { Field } from '@base-ui/react/field';
import { screen } from '@mui/internal-test-utils';
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
