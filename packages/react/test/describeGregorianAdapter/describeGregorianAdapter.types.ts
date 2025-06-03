import { TemporalAdapter, TemporalTimezone } from '@base-ui-components/react/models';

export interface DescribeGregorianAdapterParams<TLocale> {
  prepareAdapter?: (adapter: TemporalAdapter) => void;
  dateLibInstanceWithTimezoneSupport?: any;
  setDefaultTimezone: (timezone: TemporalTimezone | undefined) => void;
  frenchLocale: TLocale;
}

export interface DescribeGregorianAdapterTestSuiteParams<TLocale>
  extends Omit<DescribeGregorianAdapterParams<TLocale>, 'frenchLocale'> {
  adapter: TemporalAdapter;
  adapterTZ: TemporalAdapter;
  adapterFr: TemporalAdapter;
}

export type DescribeGregorianAdapterTestSuite = <TLocale>(
  params: DescribeGregorianAdapterTestSuiteParams<TLocale>,
) => void;
