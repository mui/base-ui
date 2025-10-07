import * as React from 'react';
import type { TypesContentProps } from '@mui/internal-docs-infra/abstractCreateTypes';
import { useTypes } from '@mui/internal-docs-infra/useTypes';
import { PropsReferenceAccordion } from './PropsReferenceAccordion';
import { AttributesReferenceTable } from './AttributesReferenceTable';
import { CssVariablesReferenceTable } from './CssVariablesReferenceTable';

type ReferenceTableProps = TypesContentProps<{
  asParam?: string;
  hideDescription?: boolean;
}>;

export function ReferenceTable(props: ReferenceTableProps) {
  const { types, multiple } = useTypes(props);

  const type = types && types[0];
  if (type?.type !== 'component') {
    return null;
  }

  const { asParam, hideDescription } = props;
  const data = type.data;
  const componentName = data.name;

  return (
    <React.Fragment>
      {/* Insert an <h3> with the part name for multi-part components.
          Single-part components headings and descriptions aren't displayed
          because they duplicate the page title and subtitle anyway. */}
      {multiple && !hideDescription && data.description && (
        <p className="mb-4">{data.description}</p>
      )}

      {Object.keys(data.props).length > 0 && (
        <PropsReferenceAccordion
          name={
            asParam && data.name.startsWith(componentName)
              ? `${asParam}${data.name.substring(componentName.length)}`
              : data.name
          }
          data={data.props}
          renameFrom={asParam ? componentName : undefined}
          renameTo={asParam}
          className="mt-5 mb-6"
        />
      )}

      {Object.keys(data.dataAttributes).length > 0 && (
        <AttributesReferenceTable data={data.dataAttributes} className="mt-5 mb-6" />
      )}

      {Object.keys(data.cssVariables).length > 0 && (
        <CssVariablesReferenceTable data={data.cssVariables} className="mt-5 mb-6" />
      )}
    </React.Fragment>
  );
}
