import * as jsxRuntime from 'react/jsx-runtime';
import { evaluate, EvaluateOptions } from '@mdx-js/mdx';

export async function evaluateMdx(
  mdxString = '',
  // Real EvaluateOptions types are really stingy and hard to use, so just the keys are enough for our purposes
  options: Partial<Record<keyof EvaluateOptions, unknown>> = {},
) {
  const { default: Component } = await evaluate(mdxString, {
    ...jsxRuntime,
    ...options,
  } as EvaluateOptions);
  return Component;
}
