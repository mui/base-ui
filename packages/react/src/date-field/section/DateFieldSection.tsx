'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDateFieldRootContext } from '../root/DateFieldRootContext';
import { TemporalFieldSection } from '../utils/types';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { DateFieldSectionDataAttributes } from './DateFieldSectionDataAttributes';

const stateAttributesMapping: StateAttributesMapping<DateFieldSectionState> = {
  sectionIndex: (index) => {
    return {
      [DateFieldSectionDataAttributes.sectionIndex]: index.toString(),
    };
  },
};

/**
 * Renders the content of a temporal field's section.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Date Field](https://base-ui.com/react/components/unstable-date-field)
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
  const propsFromState = store.useState('sectionProps', section);

  const isSeparator = section.type === 'separator';
  const state: DateFieldSection.State = {
    sectionIndex: section.index,
    empty: !isSeparator && section.value === '',
    separator: isSeparator,
  };

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, store.registerSection],
    props: [propsFromState, store.sectionEventHandlers, elementProps],
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
  /**
   * Whether the section is a separator (e.g. "/", "-").
   */
  separator: boolean;
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
