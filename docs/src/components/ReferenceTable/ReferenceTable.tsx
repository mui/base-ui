import * as React from 'react';
import type { TypesContentProps } from '@mui/internal-docs-infra/abstractCreateTypes';
import { useTypes } from '@mui/internal-docs-infra/useTypes';
import { PropsReferenceAccordion } from './PropsReferenceAccordion';
import { AttributesReferenceTable } from './AttributesReferenceTable';
import { CssVariablesReferenceTable } from './CssVariablesReferenceTable';

type ReferenceTableProps = TypesContentProps<{
  hideDescription?: boolean;
}>;

export function ReferenceTable(props: ReferenceTableProps) {
  const { types, multiple, hideDescription } = useTypes(props);

  const type = types && types[0];
  if (type?.type !== 'component') {
    return null;
  }

  const data = type.data;

  return (
    <React.Fragment>
      {multiple && !hideDescription && data.description && (
        <p className="mb-4">{data.description}</p>
      )}

      {Object.keys(data.props).length > 0 && (
        <PropsReferenceAccordion name={data.name} data={data.props} className="mt-5 mb-6" />
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
