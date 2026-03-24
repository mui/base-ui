import { Calendar } from '@base-ui/react/calendar';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, Calendar);

export const TypesCalendar = types;
export const TypesCalendarAdditional = AdditionalTypes;
