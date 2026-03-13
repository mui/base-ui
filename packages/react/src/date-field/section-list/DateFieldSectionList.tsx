'use client';
import * as React from 'react';
import { useDateFieldRootContext } from '../root/DateFieldRootContext';
import { TemporalFieldSection } from '../utils/types';

/**
 * Renders all sections of a temporal field.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Date Field](https://base-ui.com/react/components/unstable-date-field)
 */
export function DateFieldSectionList(props: DateFieldSectionList.Props): React.JSX.Element | null {
  const { children } = props;

  const store = useDateFieldRootContext();
  const sections = store.useState('sections');

  if (!sections || sections.length === 0) {
    return null;
  }

  return <React.Fragment>{sections.map(children)}</React.Fragment>;
}

export interface DateFieldSectionListProps {
  /**
   * A function that receives each section and returns a React node.
   */
  children: (section: TemporalFieldSection, index: number) => React.ReactNode;
}

export namespace DateFieldSectionList {
  export type Props = DateFieldSectionListProps;
}
