import {
  createTypesFactory,
  createMultipleTypesFactory,
} from '@mui/internal-docs-infra/abstractCreateTypes';
import { ReferenceTable } from '../components/ReferenceTable/ReferenceTable';

/**
 * Creates a type doc component that renders a reference table for the given component.
 * @param url Depends on `import.meta.url` to determine the source file location.
 * @param component The component to render a reference table for.
 * @param meta Additional meta for the typedocs.
 */
export const createTypes = createTypesFactory({
  TypesContent: ReferenceTable,
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
});
