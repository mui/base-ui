export type ComponentRenderFn<Props, State> = (props: Props, state: State) => React.ReactElement;

export type BaseUiComponentCommonProps<ElementType extends React.ElementType, OwnerState> = Omit<
  React.ComponentPropsWithoutRef<ElementType>,
  'className'
> & {
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className?: string | ((state: OwnerState) => string);
  /**
   * A function to customize rendering of the component.
   */
  render?: ComponentRenderFn<React.ComponentPropsWithRef<ElementType>, OwnerState>;
};
