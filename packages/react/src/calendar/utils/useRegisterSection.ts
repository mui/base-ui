import * as React from 'react';
import { TemporalSupportedObject } from '../../models';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { SharedCalendarSection } from './types';

/**
 * Internal utility hook to handle the registration of a section in the (Range)Calendar Root.
 * @param {useRegisterSection.Parameters} parameters The parameters of the hook.
 */
export function useRegisterSection(parameters: useRegisterSection.Parameters) {
  const { section, value } = parameters;
  const baseRootContext = useSharedCalendarRootContext();

  const registerSection = baseRootContext.registerSection;
  React.useEffect(() => {
    return registerSection({ type: section, value });
  }, [registerSection, value, section]);
}

export namespace useRegisterSection {
  export interface Parameters {
    /**
     * The type of the section.
     */
    section: SharedCalendarSection;
    /**
     * The value of the section.
     */
    value: TemporalSupportedObject;
  }
}
