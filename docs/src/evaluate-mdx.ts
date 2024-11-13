import * as jsxRuntime from 'react/jsx-runtime';
import { evaluate, EvaluateOptions } from '@mdx-js/mdx';

export async function evaluateMdx(mdxString = '', options: Record<string, unknown> = {}) {
  const { default: Component } = await evaluate(mdxString, {
    ...jsxRuntime,
    ...options,
  } as EvaluateOptions);
  return Component;
}
