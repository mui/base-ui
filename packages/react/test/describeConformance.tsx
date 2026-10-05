import type * as React from 'react';
import type { MuiRenderResult, RenderOptions } from '@mui/internal-test-utils';
import { createDescribe } from '@mui/internal-test-utils';
import { testPropForwarding } from './conformanceTests/propForwarding';
import { testRefForwarding } from './conformanceTests/refForwarding';
import { testRenderProp } from './conformanceTests/renderProp';
import { testClassName } from './conformanceTests/className';
import type { BaseUIRenderResult } from './createRenderer';

export type ConformantComponentProps = {
  render?: React.ReactElement<unknown> | ((props: Record<string, unknown>) => React.ReactNode);
  ref?: React.Ref<unknown>;
  'data-testid'?: string;
  className?: string | ((state: unknown) => string);
  style?: React.CSSProperties;
  nativeButton?: boolean;
};

/**
 * Options read by the Base UI conformance suites.
 * Declared explicitly (rather than derived from MUI's `ConformanceOptions`) so options that no
 * suite reads fail typechecking instead of silently doing nothing.
 */
export interface BaseUiConformanceTestsOptions {
  render: (
    element: React.ReactElement<
      ConformantComponentProps,
      string | React.JSXElementConstructor<any>
    >,
    options?: RenderOptions | undefined,
  ) => Promise<BaseUIRenderResult> | MuiRenderResult;
  /**
   * The constructor the forwarded ref is expected to be an instance of.
   */
  refInstanceof: abstract new (...args: any[]) => unknown;
  /**
   * The element the render-prop and prop-forwarding tests render in place of the default one.
   * Rendering a `button` also sets `nativeButton` on components that accept it.
   * @default 'div'
   */
  testRenderPropWith?: keyof React.JSX.IntrinsicElements;
  /**
   * Whether the component accepts the `nativeButton` prop.
   */
  button?: boolean;
  /**
   * Whether the component is allowed to be wrapped by an extra element for testing.
   * @default true
   */
  wrappingAllowed?: boolean;
}

function describeConformanceFn(
  minimalElement: React.ReactElement<ConformantComponentProps>,
  getOptions: () => BaseUiConformanceTestsOptions,
) {
  testPropForwarding(minimalElement, getOptions);
  testRefForwarding(minimalElement, getOptions);
  testRenderProp(minimalElement, getOptions);
  testClassName(minimalElement, getOptions);
}

export const describeConformance = createDescribe('Base UI component API', describeConformanceFn);
