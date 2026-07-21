import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { useRender } from '@base-ui/react/use-render';
import { mergeProps } from '@base-ui/react/merge-props';
import styles from './use-render.module.css';

/**
 * Stories follow research/c-components/use-render (Tier 3 utils floor):
 * useRender is the one util whose whole point is rendering, so both stories
 * build the exact custom components shown in the docs' TypeScript examples
 * (Text / Counter) rather than inventing new ones (story-plan.md). Anti-story
 * note (brief §10, #4039): never pass `render={Component}` — always
 * `render={<Component />}` or a callback — that footgun stays MDX-only prose.
 */
const meta = {
  title: 'Utilities/useRender',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* CustomComponent — the docs' Text example, rendered both ways         */
/* ------------------------------------------------------------------ */

interface TextProps extends useRender.ComponentProps<'p'> {}

function Text(props: TextProps) {
  const { render, ...otherProps } = props;

  const element = useRender({
    defaultTagName: 'p',
    render,
    props: mergeProps<'p'>({ className: styles.Text }, otherProps),
  });

  return element;
}

/** `useRender` lets a component built entirely from scratch accept a `render` prop exactly like Base UI's own parts do — the docs' Text example, built with `defaultTagName: 'p'` and `mergeProps(defaultProps, otherProps)`. Passing `render={<a href="..." />}` swaps the rendered element while keeping the merged props (`className`, `children`) intact. */
export const CustomComponent: Story = {
  render: () => (
    <div className={styles.Stack}>
      <Text>Text component rendered as a paragraph tag</Text>
      <Text
        render={<a href="https://base-ui.com/react/utils/use-render">Read the useRender docs</a>}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Read the useRender docs' });
    await expect(link.tagName).toBe('A');
    await expect(link).toHaveAttribute('href', 'https://base-ui.com/react/utils/use-render');

    const paragraph = canvas.getByText('Text component rendered as a paragraph tag');
    await expect(paragraph.tagName).toBe('P');
  },
};

/** Dark-theme variant of CustomComponent (visual only — the interaction assertions stay on the light story). */
export const Dark: Story = {
  render: CustomComponent.render,
  globals: { theme: 'dark' },
};

/* ------------------------------------------------------------------ */
/* StateToDataAttributes — the docs' Counter example                    */
/* ------------------------------------------------------------------ */

interface CounterState {
  odd: boolean;
}

interface CounterProps extends useRender.ComponentProps<'button', CounterState> {}

function Counter(props: CounterProps) {
  const { render, ...otherProps } = props;

  const [count, setCount] = React.useState(0);
  const odd = count % 2 === 1;
  const state = React.useMemo(() => ({ odd }), [odd]);

  const defaultProps: useRender.ElementProps<'button'> = {
    className: styles.Button,
    type: 'button',
    children: (
      <React.Fragment>
        Counter: <span className={styles.count}>{count}</span>
      </React.Fragment>
    ),
    onClick() {
      setCount((prev) => prev + 1);
    },
    'aria-label': `Count is ${count}, click to increase.`,
  };

  const element = useRender({
    defaultTagName: 'button',
    render,
    state,
    props: mergeProps<'button'>(defaultProps, otherProps),
  });

  return element;
}

/** Passing `state` as the second `useRender` argument makes it available to the function-form `render` callback *and* auto-converts it to `data-*` attributes on the rendered element (here `data-odd`) — the docs' Counter example, pinning the state→data-attribute conversion and the "you own the spread" contract of the function form. */
export const StateToDataAttributes: Story = {
  render: () => (
    <Counter
      render={(props, state) => (
        <button type="button" {...props}>
          {props.children}
          <span aria-hidden="true"> {state.odd ? '(odd)' : '(even)'}</span>
        </button>
      )}
    />
  ),
  play: async ({ canvas, userEvent }) => {
    // The accessible name includes the live count, so query by role alone —
    // this story renders exactly one button.
    const button = canvas.getByRole('button');
    await expect(button).not.toHaveAttribute('data-odd');

    await userEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('data-odd'));

    await userEvent.click(button);
    await waitFor(() => expect(button).not.toHaveAttribute('data-odd'));
  },
};
