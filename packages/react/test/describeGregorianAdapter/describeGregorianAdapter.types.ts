import {
  TemporalAdapter,
  TemporalSupportedObject,
  TemporalTimezone,
} from '@base-ui-components/react/models';

export interface DescribeGregorianAdapterParameters {
  /**
   * Default adapter
   */
  adapter: TemporalAdapter;
  /**
   * Adapter with French locale.
   */
  adapterFr: TemporalAdapter;
  /**
   * Adapter with timezone support.
   * If not provided, will use the same adapter as `adapter`.
   */
  adapterTZ?: TemporalAdapter;
  /**
   * Sets the default timezone of the date library.
   * This is used to ensure that the adapter works correctly when the timezone is set to "default".
   */
  setDefaultTimezone: (timezone: TemporalTimezone | undefined) => void;
  /**
   * Creates a date in French locale.
   */
  createDateInFrenchLocale: (dateStr: string) => TemporalSupportedObject;
}

export type DescribeGregorianAdapterTestSuite = (
  params: DescribeGregorianAdapterParameters,
) => void;
