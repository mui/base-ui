import type { BaseUIComponentProps } from '../../internals/types';

type StateProps<State> = Pick<
  BaseUIComponentProps<'span', State>,
  'className' | 'style' | 'render'
>;

/**
 * Adapts the state callbacks of a part that renders a Base UI component, so they
 * receive the part's own state rather than the component's.
 */
export function mapStateProps<ComponentState, PartState>(
  props: StateProps<PartState>,
  toPartState: (state: ComponentState) => PartState,
): StateProps<ComponentState> {
  const { className, style, render } = props;
  return {
    className:
      typeof className === 'function' ? (state) => className(toPartState(state)) : className,
    style: typeof style === 'function' ? (state) => style(toPartState(state)) : style,
    render:
      typeof render === 'function'
        ? (renderProps, state) => render(renderProps, toPartState(state))
        : render,
  };
}
