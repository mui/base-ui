import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { MeterRoot } from './MeterRoot';

export const meterStyleHookMapping: CustomStyleHookMapping<MeterRoot.State> = {
  direction: () => null,
  max: () => null,
  min: () => null,
  isOptimal: (value: boolean) => {
    if (value) {
      return {
        'data-optimum': '',
      };
    }

    return null;
  },
};
