import * as React from 'react';
import {
  ConformanceOptions,
  MuiRenderResult,
  RenderOptions,
  createDescribe,
  testReactTestRenderer,
} from '@mui/internal-test-utils';
import { testPropForwarding } from './conformanceTests/propForwarding';
import { testRefForwarding } from './conformanceTests/refForwarding';
import { testRenderProp } from './conformanceTests/renderProp';
import { testClassName } from './conformanceTests/className';

export interface BaseUiConformanceTestsOptions
  extends Omit<Partial<ConformanceOptions>, 'render' | 'mount' | 'skip' | 'classes'> {
  render: (
    element: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    options?: RenderOptions | undefined,
  ) => Promise<MuiRenderResult> | MuiRenderResult;
  skip?: (keyof typeof fullSuite)[];
  testRenderPropWith?: keyof JSX.IntrinsicElements;
}

const fullSuite = {
  propsSpread: testPropForwarding,
  reactTestRenderer: testReactTestRenderer,
  refForwarding: testRefForwarding,
  renderProp: testRenderProp,
  className: testClassName,
};

function describeConformanceFn(
  minimalElement: React.ReactElement,
  getOptions: () => BaseUiConformanceTestsOptions,
) {
  const { after: runAfterHook = () => {}, only = Object.keys(fullSuite), skip = [] } = getOptions();

  const filteredTests = Object.keys(fullSuite).filter(
    (testKey) =>
      only.indexOf(testKey) !== -1 && skip.indexOf(testKey as keyof typeof fullSuite) === -1,
  ) as (keyof typeof fullSuite)[];

  after(runAfterHook);

  filteredTests.forEach((testKey) => {
    const test = fullSuite[testKey];
    test(minimalElement, getOptions as any);
  });
}

const describeConformance = createDescribe('Base UI component API', describeConformanceFn);

export { describeConformance };
