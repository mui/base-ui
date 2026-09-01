import { expect, vi } from 'vitest';
import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { createRenderer, describeConformance } from '#test-utils';
import { screen } from '@mui/internal-test-utils';

describe('<Select.GroupLabel />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.GroupLabel />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open>
          <Select.Group>{node}</Select.Group>
        </Select.Root>,
      );
    },
  }));

  it('is hidden from the accessibility tree by default', async () => {
    await render(
      <Select.Root open>
        <Select.Group>
          <Select.GroupLabel>Fruits</Select.GroupLabel>
        </Select.Group>
      </Select.Root>,
    );

    expect(screen.getByText('Fruits')).toHaveAttribute('aria-hidden', 'true');
  });

  it('allows overriding aria-hidden', async () => {
    await render(
      <Select.Root open>
        <Select.Group>
          <Select.GroupLabel aria-hidden={undefined}>Fruits</Select.GroupLabel>
        </Select.Group>
      </Select.Root>,
    );

    expect(screen.getByText('Fruits')).not.toHaveAttribute('aria-hidden');
  });

  it('throws a descriptive error when rendered outside <Select.Group>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Select.Root open>
            <Select.GroupLabel />
          </Select.Root>,
        ),
      ).rejects.toThrow(
        'Base UI: SelectGroupContext is missing. SelectGroup parts must be placed within <Select.Group>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('removes the group aria-labelledby attribute when unmounted', async () => {
    function Test({ labelMounted }: { labelMounted: boolean }) {
      return (
        <Select.Root open>
          <Select.Group>
            {labelMounted && <Select.GroupLabel id="group-label">Fruits</Select.GroupLabel>}
          </Select.Group>
        </Select.Root>
      );
    }

    const { rerender } = await render(<Test labelMounted />);

    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-labelledby', 'group-label');

    await rerender(<Test labelMounted={false} />);

    expect(screen.queryByText('Fruits')).toBe(null);
    expect(group).not.toHaveAttribute('aria-labelledby');
  });

  it('does not let an older label cleanup clear a newer label', async () => {
    function Test({ labels }: { labels: 'old' | 'both' | 'new' }) {
      return (
        <Select.Root open>
          <Select.Group>
            {labels !== 'new' && (
              <Select.GroupLabel key="old" id="old-label">
                Old
              </Select.GroupLabel>
            )}
            {labels !== 'old' && (
              <Select.GroupLabel key="new" id="new-label">
                New
              </Select.GroupLabel>
            )}
          </Select.Group>
        </Select.Root>
      );
    }

    const { rerender } = await render(<Test labels="old" />);

    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-labelledby', 'old-label');

    await rerender(<Test labels="both" />);
    expect(group).toHaveAttribute('aria-labelledby', 'new-label');

    await rerender(<Test labels="new" />);
    expect(group).toHaveAttribute('aria-labelledby', 'new-label');
  });

  it('updates explicit and generated ids independently of ref churn', async () => {
    const firstRef = vi.fn();
    const secondRef = vi.fn();

    function Test({
      id,
      labelRef,
    }: {
      id?: string | undefined;
      labelRef: React.Ref<HTMLDivElement>;
    }) {
      return (
        <Select.Root open>
          <Select.Group>
            <Select.GroupLabel id={id} ref={labelRef}>
              Fruits
            </Select.GroupLabel>
          </Select.Group>
        </Select.Root>
      );
    }

    const { rerender } = await render(<Test labelRef={firstRef} />);

    const group = screen.getByRole('group');
    const label = screen.getByText('Fruits');
    const generatedId = label.id;
    expect(group).toHaveAttribute('aria-labelledby', generatedId);

    await rerender(<Test id="custom-label" labelRef={secondRef} />);
    expect(group).toHaveAttribute('aria-labelledby', 'custom-label');
    expect(firstRef).toHaveBeenLastCalledWith(null);
    expect(secondRef).toHaveBeenLastCalledWith(label);

    await rerender(<Test labelRef={secondRef} />);
    expect(group).toHaveAttribute('aria-labelledby', generatedId);
  });

  it('replaces and unregisters its label in Strict Mode', async () => {
    function Test({ labelId }: { labelId?: string | undefined }) {
      return (
        <React.StrictMode>
          <Select.Root open>
            <Select.Group>
              {labelId && (
                <Select.GroupLabel key={labelId} id={labelId}>
                  {labelId}
                </Select.GroupLabel>
              )}
            </Select.Group>
          </Select.Root>
        </React.StrictMode>
      );
    }

    const { rerender } = await render(<Test labelId="first-label" />);

    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-labelledby', 'first-label');

    await rerender(<Test labelId="second-label" />);
    expect(group).toHaveAttribute('aria-labelledby', 'second-label');

    await rerender(<Test />);
    expect(group).not.toHaveAttribute('aria-labelledby');
  });
});
