'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDateFieldRootContext } from '../root/DateFieldRootContext';
import { TemporalFieldSection } from '../../utils/temporal/field/types';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { DateFieldSectionDataAttributes } from './DateFieldSectionDataAttributes';
import { TemporalFieldSectionPropsPlugin } from '../../utils/temporal/field/TemporalFieldSectionPropsPlugin';

const stateAttributesMapping: StateAttributesMapping<DateFieldSectionState> = {
  sectionIndex: (index) => {
    return {
      [DateFieldSectionDataAttributes.sectionIndex]: index.toString(),
    };
  },
};

/**
 * Groups all parts of the date field.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Date Field](https://base-ui.com/react/components/date-field)
 */
export const DateFieldSection = React.forwardRef(function DateFieldSection(
  componentProps: DateFieldSection.Props,
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
    TemporalFieldSectionPropsPlugin.selectors.sectionProps,
    section,
  );

  const state: DateFieldSection.State = {
    sectionIndex: section.index,
    empty: section.value === '',
  };

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, store.dom.registerSection],
    props: [
      propsFromState,
      {
        onClick: store.sectionProps.handleClick,
        onInput: store.sectionProps.handleInput,
        onPaste: store.sectionProps.handlePaste,
        onKeyDown: store.sectionProps.handleKeyDown,
        onMouseUp: store.sectionProps.handleMouseUp,
        onDragOver: store.sectionProps.handleDragOver,
        onFocus: store.sectionProps.handleFocus,
        onBlur: store.sectionProps.handleBlur,
      },
      elementProps,
    ],
    stateAttributesMapping,
  });
});

export interface DateFieldSectionState {
  /**
   * Index of the section in the field.
   */
  sectionIndex: number;
  /**
   * Whether the section is empty.
   */
  empty: boolean;
}

export interface DateFieldSectionProps extends BaseUIComponentProps<'div', DateFieldSectionState> {
  /**
   * The section to render.
   */
  section: TemporalFieldSection;
}

export namespace DateFieldSection {
  export type Props = DateFieldSectionProps;
  export type State = DateFieldSectionState;
}
