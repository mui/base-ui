import {
  createTypesFactory,
  createMultipleTypesFactory,
} from '@mui/internal-docs-infra/abstractCreateTypes';
import clsx from 'clsx';
import { ReferenceTable } from '../components/ReferenceTable/ReferenceTable';
import { mdxComponents } from '../mdx-components';
import * as CodeBlock from '../components/CodeBlock';
import { CodeBlockPreComputed } from '../components/CodeBlock/CodeBlockPreComputed';
import { Code } from '../components/Code';

interface MDXComponents {
  [key: string]: React.FC<any> | MDXComponents;
}

const components: MDXComponents = {
  ...mdxComponents,
  pre: (props) => (
    <CodeBlock.Root>
      <CodeBlockPreComputed {...props} />
    </CodeBlock.Root>
  ),
};

function TableCode(props: React.ComponentProps<typeof Code>) {
  return <Code {...props} data-table-code="" className={clsx(props.className, 'TableCode')} />;
}

/**
 * Creates a type doc component that renders a reference table for the given component.
 * @param url Depends on `import.meta.url` to determine the source file location.
 * @param component The component to render a reference table for.
 * @param [meta] Additional meta for the typedocs.
 */
export const createTypes = createTypesFactory({
  TypesTable: ReferenceTable,
  components,
  TypePre: CodeBlock.PreInline,
  ShortTypeCode: TableCode,
  DefaultCode: TableCode,
  typeRefComponent: 'TypeRef',
  typePropRefComponent: 'TypePropRef',
});

/**
 * Creates a type doc component that renders a reference table for the given component.
 * A variant is a different implementation style of the same component.
 * @param url Depends on `import.meta.url` to determine the source file location.
 * @param components The components to render reference tables for.
 * @param [meta] Additional meta for the typedocs.
 */
export const createMultipleTypes = createMultipleTypesFactory({
  TypesTable: ReferenceTable,
  components,
  TypePre: CodeBlock.PreInline,
  ShortTypeCode: TableCode,
  DefaultCode: TableCode,
  typeRefComponent: 'TypeRef',
  typePropRefComponent: 'TypePropRef',
});
