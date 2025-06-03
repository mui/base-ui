import createDescribe from '@mui/internal-test-utils/createDescribe';
import { TemporalAdapter } from '@base-ui-components/react/models';
import { testCalculations } from './testCalculations';
import { testLocalization } from './testLocalization';
import { testFormats } from './testFormats';
import {
  DescribeGregorianAdapterParams,
  DescribeGregorianAdapterTestSuiteParams,
} from './describeGregorianAdapter.types';

function innerGregorianDescribeAdapter<TLocale>(
  Adapter: new (...args: any) => TemporalAdapter,
  params: DescribeGregorianAdapterParams<TLocale>,
) {
  const adapter = new Adapter();
  const adapterTZ = params.dateLibInstanceWithTimezoneSupport
    ? new Adapter({
        dateLibInstance: params.dateLibInstanceWithTimezoneSupport,
      })
    : new Adapter();
  const adapterFr = new Adapter({
    locale: params.frenchLocale,
    dateLibInstance: params.dateLibInstanceWithTimezoneSupport,
  });

  params.prepareAdapter?.(adapter);
  params.prepareAdapter?.(adapterTZ);

  describe(adapter.lib, () => {
    const testSuitParams: DescribeGregorianAdapterTestSuiteParams<TLocale> = {
      ...params,
      adapter,
      adapterTZ,
      adapterFr,
    };

    testCalculations(testSuitParams);
    testLocalization(testSuitParams);
    testFormats(testSuitParams);
  });
}

type Params<TLocale> = [
  Adapter: new (...args: any) => TemporalAdapter,
  params: DescribeGregorianAdapterParams<TLocale>,
];

type DescribeGregorianAdapter = {
  <TLocale>(...args: Params<TLocale>): void;
  skip: <TLocale>(...args: Params<TLocale>) => void;
  only: <TLocale>(...args: Params<TLocale>) => void;
};

export const describeGregorianAdapter = createDescribe(
  'Gregorian adapter methods',
  innerGregorianDescribeAdapter,
) as DescribeGregorianAdapter;
