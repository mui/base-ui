import * as React from 'react';
import { PickerValidDate } from '../../../../../models';
import { useBaseCalendarRootContext } from '../root/BaseCalendarRootContext';
import { BaseCalendarSection } from './types';

/**
 * Internal utility hook to handle the registration of a section in the (Range)Calendar Root.
 * @param {useRegisterSection.Parameters} parameters The parameters of the hook.
 */
export function useRegisterSection(parameters: useRegisterSection.Parameters) {
  const { section, value } = parameters;
  const baseRootContext = useBaseCalendarRootContext();

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
    section: BaseCalendarSection;
    /**
     * The value of the section.
     */
    value: PickerValidDate;
  }
}
