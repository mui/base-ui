'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDateFieldRootContext } from '../root/DateFieldRootContext';
import { TemporalFieldSection } from '../../utils/temporal/field/types';
import { TemporalFieldSeparatorPropsPlugin } from '../../utils/temporal/field/TemporalFieldSeparatorPropsPlugin';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { DateFieldSeparatorDataAttributes } from './DateFieldSeparatorDataAttributes';

const stateAttributesMapping: StateAttributesMapping<DateFieldSeparatorState> = {
  sectionIndex: (index) => {
    return {
      [DateFieldSeparatorDataAttributes.sectionIndex]: index.toString(),
    };
  },
};

/**
 * Renders a the separator of a date field's section.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Date Field](https://base-ui.com/react/components/date-field)
 */
export const DateFieldSeparator = React.forwardRef(function DateFieldSeparator(
  componentProps: DateFieldSeparator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    // Rendering props
    className,
    render,
    // Internal props
    section,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const store = useDateFieldRootContext();
  const propsFromState = useStore(
    store,
    TemporalFieldSeparatorPropsPlugin.selectors.separatorProps,
    section,
  );

  const state: DateFieldSeparator.State = {
    sectionIndex: section.index,
  };

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef],
    props: [
      propsFromState,
      {
        onClick: store.separatorProps.handleClick,
        onMouseUp: store.separatorProps.handleMouseUp,
      },
      elementProps,
    ],
    stateAttributesMapping,
  });
});

export interface DateFieldSeparatorState {
  /**
   * Index of the section in the field.
   */
  sectionIndex: number;
}

export interface DateFieldSeparatorProps extends BaseUIComponentProps<
  'div',
  DateFieldSeparatorState
> {
  /**
   * The section to render.
   */
  section: TemporalFieldSection;
}

export namespace DateFieldSeparator {
  export type Props = DateFieldSeparatorProps;
  export type State = DateFieldSeparatorState;
}
