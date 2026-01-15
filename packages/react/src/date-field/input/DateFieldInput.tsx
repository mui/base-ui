'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDateFieldRootContext } from '../root/DateFieldRootContext';
import { TemporalFieldSection } from '../../utils/temporal/field/types';
import { TemporalFieldSectionPlugin } from '../../utils/temporal/field/TemporalFieldSectionPlugin';

/**
 * Groups all sections of the date field input.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Date Field](https://base-ui.com/react/components/date-field)
 */
export const DateFieldInput = React.forwardRef(function DateFieldInput(
  componentProps: DateFieldInput.Props,
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
  const sections = useStore(store, TemporalFieldSectionPlugin.selectors.sections);

  const resolvedChildren = React.useMemo(() => {
    if (!React.isValidElement(children) && typeof children === 'function') {
      return sections.map((section) => children(section));
    }

    return children;
  }, [children, sections]);

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, store.dom.inputRef],
    props: [
      {
        children: resolvedChildren,
        onClick: store.inputProps.handleClick,
      },
      elementProps,
    ],
  });
});

export interface DateFieldInputState {}

export interface DateFieldInputProps extends Omit<
  BaseUIComponentProps<'div', DateFieldInputState>,
  'children'
> {
  /**
   * The children of the component.
   * If a function is provided, it will be called with the public context as its parameter.
   */
  children?: React.ReactNode | ((section: TemporalFieldSection) => React.ReactNode);
}

export namespace DateFieldInput {
  export type Props = DateFieldInputProps;
  export type State = DateFieldInputState;
}
