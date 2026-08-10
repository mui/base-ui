import { expect, vi } from 'vitest';
import * as React from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
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

describe('<Checkbox.Root /> with the React 17 id fallback', () => {
  const { render, renderToString } = createRenderer();

  function TestCase(props: {
    checkboxId?: string | undefined;
    checkboxKey?: React.Key | undefined;
    nativeButton: boolean;
  }) {
    const { checkboxId, checkboxKey, nativeButton } = props;

    return (
      <Field.Root>
        <Field.Label data-testid="label">Label</Field.Label>
        <Checkbox.Root
          key={checkboxKey}
          id={checkboxId}
          nativeButton={nativeButton}
          render={nativeButton ? <button /> : undefined}
        />
      </Field.Root>
    );
  }

  function getLabelControl(nativeButton: boolean) {
    return nativeButton
      ? screen.getByRole('checkbox')
      : document.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
  }

  it.each([false, true])(
    'drops an explicit id when the prop is removed (nativeButton=%s)',
    async (nativeButton) => {
      const { rerender } = await render(
        <TestCase checkboxId="explicit" nativeButton={nativeButton} />,
      );

      await rerender(<TestCase nativeButton={nativeButton} />);

      const control = getLabelControl(nativeButton);
      expect(control.id).not.toBe('');
      expect(control).not.toHaveAttribute('id', 'explicit');
      expect(screen.getByTestId('label')).toHaveAttribute('for', control.id);
    },
  );

  it.each([false, true])(
    'does not reuse an unmounted Checkbox id for a keyed id-less Checkbox (nativeButton=%s)',
    async (nativeButton) => {
      const { rerender } = await render(
        <TestCase checkboxKey="explicit" checkboxId="explicit" nativeButton={nativeButton} />,
      );

      await rerender(<TestCase checkboxKey="generated" nativeButton={nativeButton} />);

      const control = getLabelControl(nativeButton);
      expect(control.id).not.toBe('');
      expect(control).not.toHaveAttribute('id', 'explicit');
      expect(screen.getByTestId('label')).toHaveAttribute('for', control.id);
    },
  );

  it.each([false, true])(
    'does not stringify an unavailable group id during SSR (nativeButton=%s)',
    (nativeButton) => {
      renderToString(
        <Field.Root name="apple">
          <CheckboxGroup allValues={['fuji']}>
            <Field.Item>
              <Field.Label>Fuji</Field.Label>
              <Checkbox.Root
                value="fuji"
                nativeButton={nativeButton}
                render={nativeButton ? <button /> : undefined}
              />
            </Field.Item>
          </CheckboxGroup>
        </Field.Root>,
      );

      expect(getLabelControl(nativeButton)).not.toHaveAttribute('id', 'undefined-fuji');
    },
  );

  it.each([false, true])(
    'omits parent aria-controls while the group id is unavailable (nativeButton=%s)',
    (nativeButton) => {
      renderToString(
        <Field.Root name="apple">
          <CheckboxGroup allValues={['fuji', 'gala']}>
            <Field.Item>
              <Checkbox.Root
                parent
                data-testid="parent"
                nativeButton={nativeButton}
                render={nativeButton ? <button /> : undefined}
              />
            </Field.Item>
            <Field.Item>
              <Checkbox.Root
                value="fuji"
                nativeButton={nativeButton}
                render={nativeButton ? <button /> : undefined}
              />
            </Field.Item>
          </CheckboxGroup>
        </Field.Root>,
      );

      expect(screen.getByTestId('parent')).not.toHaveAttribute('aria-controls');
    },
  );
});
