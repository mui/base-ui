import type { MDXComponents } from 'mdx/types';
import { DemoLoader } from './components/demo/NewDemoLoader';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Demo: DemoLoader,
    ...components,
  };
}
