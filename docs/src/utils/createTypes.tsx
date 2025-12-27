import {
  createTypesFactory,
  createMultipleTypesFactory,
} from '@mui/internal-docs-infra/abstractCreateTypes';
import clsx from 'clsx';
import { ReferenceTable } from '../components/ReferenceTable/ReferenceTable';
import { mdxComponents as components, inlineMdxComponents } from '../mdx-components';

interface MDXComponents {
  [key: string]: React.FC<any> | MDXComponents;
}

const Code =
  typeof inlineMdxComponents.code === 'function'
    ? inlineMdxComponents.code
    : (props: any) => <code {...props} />;

const inlineComponents: MDXComponents = {
  ...inlineMdxComponents,
  code: (props) => (
    <Code {...props} data-table-code="" className={clsx(props.className, 'text-xs')} />
  ),
  pre: (props) => <pre {...props} className={clsx(props.className, 'text-xs p-0 m-0')} />,
};

/**
 * Creates a type doc component that renders a reference table for the given component.
 * @param url Depends on `import.meta.url` to determine the source file location.
 * @param component The component to render a reference table for.
 * @param meta Additional meta for the typedocs.
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
 * @param meta Additional meta for the typedocs.
 */
export const createMultipleTypes = createMultipleTypesFactory({
  TypesContent: ReferenceTable,
  components,
  inlineComponents,
});
