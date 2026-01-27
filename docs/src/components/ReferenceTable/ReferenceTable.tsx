import * as React from 'react';
import type { TypesContentProps } from '@mui/internal-docs-infra/abstractCreateTypes';
import { useTypes } from '@mui/internal-docs-infra/useTypes';
import { ReferenceAccordion } from './ReferenceAccordion';
import { AttributesReferenceTable } from './AttributesReferenceTable';
import { CssVariablesReferenceTable } from './CssVariablesReferenceTable';
import { ParametersReferenceTable } from './ParametersReferenceTable';
import { ReturnValueReferenceTable } from './ReturnValueReferenceTable';

import '../Demo/CodeHighlighting.css';
import AdditionalTypesAccordion from './AdditionalTypesAccordion';

type ReferenceTableProps = TypesContentProps<{
  hideDescription?: boolean;
}>;

export function ReferenceTable(props: ReferenceTableProps) {
  const { type, additionalTypes, multiple, hideDescription } = useTypes(props);

  if (!type) {
    return <p>No type information provided.</p>;
  }

  if (type.type === 'component') {
    const data = type.data;
    return (
      <React.Fragment>
        {multiple && !hideDescription && data.description && data.description}

        {Object.keys(data.props).length > 0 && (
          <ReferenceAccordion name={data.name} data={data.props} className="mt-5 mb-6" />
        )}

        {Object.keys(data.dataAttributes).length > 0 && (
          <AttributesReferenceTable data={data.dataAttributes} className="mt-5 mb-6" />
        )}

        {Object.keys(data.cssVariables).length > 0 && (
          <CssVariablesReferenceTable data={data.cssVariables} className="mt-5 mb-6" />
        )}

        {additionalTypes && additionalTypes.length > 0 && (
          <AdditionalTypesAccordion data={additionalTypes} />
        )}
      </React.Fragment>
    );
  }

  if (type.type === 'hook') {
    const data = type.data;
    return (
      <React.Fragment>
        {multiple && !hideDescription && data.description && data.description}

        {Object.keys(data.parameters).length > 0 && (
          <ParametersReferenceTable name={data.name} data={data.parameters} className="mt-5 mb-6" />
        )}

        {data.returnValue && data.returnValue.kind === 'object' && (
          <ReturnValueReferenceTable data={data.returnValue.properties} className="mt-5 mb-6" />
        )}

        {additionalTypes && additionalTypes.length > 0 && (
          <AdditionalTypesAccordion data={additionalTypes} />
        )}
      </React.Fragment>
    );
  }

  if (type.type === 'function') {
    const data = type.data;
    return (
      <React.Fragment>
        {multiple && !hideDescription && data.description && data.description}

        {Object.keys(data.parameters).length > 0 && (
          <ParametersReferenceTable name={data.name} data={data.parameters} className="mt-5 mb-6" />
        )}

        {additionalTypes && additionalTypes.length > 0 && (
          <AdditionalTypesAccordion data={additionalTypes} />
        )}
      </React.Fragment>
    );
  }

  // type.type === 'raw'
  return (
    <React.Fragment>
      {additionalTypes && additionalTypes.length > 0 && (
        <AdditionalTypesAccordion data={additionalTypes} />
      )}
    </React.Fragment>
  );
}
