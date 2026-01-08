import * as React from 'react';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useStore } from '@base-ui/utils/store';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDateFieldRootContext } from '../root/DateFieldRootContext';
import { selectors } from '../../utils/temporal/field/selectors';

/**
 * Groups all parts of the date field.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Date Field](https://base-ui.com/react/components/date-field)
 */
export const DateFieldRoot = React.forwardRef(function DateFieldRoot(
  componentProps: DateFieldRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    // Rendering props
    className,
    render,
    children,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const store = useDateFieldRootContext();
  const isSelectingAllSections = useStore(store, selectors.isSelectingAllSections);

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return children(EMPTY_OBJECT);
    }

    return children;
  }, [children]);

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      {
        children: resolvedChildren,
        onKeyDown: store.inputProps.handleKeyDown,
        onFocus: store.inputProps.handleFocus,
        onBlur: store.inputProps.handleBlur,
        onClick: store.inputProps.handleClick,
        onPaste: store.inputProps.handlePaste,
        onInput: store.inputProps.handleInput,

        // Other
        contentEditable: isSelectingAllSections,
        suppressContentEditableWarning: true,
        // tabIndex: internalPropsWithDefaults.disabled || parsedSelectedSections === 0 ? -1 : 0, // TODO: Try to set to undefined when there is a section selected.
      },
      elementProps,
    ],
  });
});

export interface DateFieldRootState {}

export interface DateFieldRootProps extends Omit<
  BaseUIComponentProps<'div', DateFieldRootState>,
  'children'
> {
  /**
   * The children of the component.
   * If a function is provided, it will be called with the public context as its parameter.
   */
  children?: React.ReactNode | ((parameters: {}) => React.ReactNode);
}

export namespace DateFieldRoot {
  export type Props = DateFieldRootProps;
  export type State = DateFieldRootState;
}
