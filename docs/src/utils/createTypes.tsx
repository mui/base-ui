import {
  createTypesFactory,
  createMultipleTypesFactory,
} from '@mui/internal-docs-infra/abstractCreateTypes';
import clsx from 'clsx';
import { ReferenceTable } from '../components/ReferenceTable/ReferenceTable';
import { mdxComponents, inlineMdxComponents } from '../mdx-components';
import { CodeBlockPrecomputed } from '../components/CodeBlockPrecomputed';
import { Code } from '../components/Code';

interface MDXComponents {
  [key: string]: React.FC<any> | MDXComponents;
}

const components: MDXComponents = {
  ...mdxComponents,
  pre: CodeBlockPrecomputed,
};

const inlineComponents: MDXComponents = {
  ...inlineMdxComponents,
  code: (props) => (
    <Code
      {...props}
      data-table-code=""
      className={clsx(props.className, 'text-xs', 'data-[inline]:mx-[0.1em]')}
    />
  ),
};

/**
 * Creates a type doc component that renders a reference table for the given component.
 * @param url Depends on `import.meta.url` to determine the source file location.
 * @param component The component to render a reference table for.
 * @param [meta] Additional meta for the typedocs.
 */
export const createTypes = createTypesFactory({
  TypesContent: ReferenceTable,
  components,
  inlineComponents,
});

/**
 * Creates a type doc component that renders a reference table for the given component.
 * A variant is a different implementation style of the same component.
 * @param url Depends on `import.meta.url` to determine the source file location.
 * @param components The components to render reference tables for.
 * @param [meta] Additional meta for the typedocs.
 */
export const createMultipleTypes = createMultipleTypesFactory({
  TypesContent: ReferenceTable,
  components,
  inlineComponents,
});
