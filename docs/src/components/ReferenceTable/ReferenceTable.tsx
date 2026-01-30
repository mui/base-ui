import * as React from 'react';
import type { TypesContentProps } from '@mui/internal-docs-infra/abstractCreateTypes';
import { useTypes } from '@mui/internal-docs-infra/useTypes';
import { ReferenceAccordion } from './ReferenceAccordion';
import { AttributesReferenceTable } from './AttributesReferenceTable';
import { CssVariablesReferenceTable } from './CssVariablesReferenceTable';
import { ParametersReferenceTable } from './ParametersReferenceTable';
import { ReturnValueReferenceTable } from './ReturnValueReferenceTable';
import { PropertiesReferenceAccordion } from './PropertiesReferenceAccordion';
import { MethodsReferenceAccordion } from './MethodsReferenceAccordion';
import { AdditionalTypesAccordion } from './AdditionalTypesAccordion';

import '../Demo/CodeHighlighting.css';

type ReferenceTableProps = TypesContentProps<{
  hideDescription?: boolean;
}>;

export function ReferenceTable(props: ReferenceTableProps) {
  const { type, additionalTypes, multiple, hideDescription } = useTypes(props);

  if (type?.type === 'component') {
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
          <AdditionalTypesAccordion data={additionalTypes} multiple={multiple} />
        )}
      </React.Fragment>
    );
  }

  if (type?.type === 'hook') {
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
          <AdditionalTypesAccordion data={additionalTypes} multiple={multiple} />
        )}
      </React.Fragment>
    );
  }

  if (type?.type === 'function') {
    const data = type.data;
    return (
      <React.Fragment>
        {multiple && !hideDescription && data.description && data.description}

        {Object.keys(data.parameters).length > 0 && (
          <ParametersReferenceTable name={data.name} data={data.parameters} className="mt-5 mb-6" />
        )}

        {data.returnValue && (
          <div className="mt-5 mb-6">
            <h4 className="mb-3 text-base font-medium text-gray-900 dark:text-white">
              Return value
            </h4>
            {data.returnValue}
          </div>
        )}

        {additionalTypes && additionalTypes.length > 0 && (
          <AdditionalTypesAccordion data={additionalTypes} multiple={multiple} />
        )}
      </React.Fragment>
    );
  }

  if (type?.type === 'class') {
    const data = type.data;

    // Separate static and instance methods
    const staticMethods: Record<string, (typeof data.methods)[string]> = {};
    const instanceMethods: Record<string, (typeof data.methods)[string]> = {};

    Object.entries(data.methods).forEach(([name, method]) => {
      if (method.isStatic) {
        staticMethods[name] = method;
      } else {
        instanceMethods[name] = method;
      }
    });

    return (
      <React.Fragment>
        {multiple && !hideDescription && data.description && data.description}

        {Object.keys(staticMethods).length > 0 && (
          <MethodsReferenceAccordion
            name={data.name}
            data={staticMethods}
            className="mt-5 mb-6"
            methodLabel="Static method"
          />
        )}

        {Object.keys(data.constructorParameters).length > 0 && (
          <ParametersReferenceTable
            name={data.name}
            data={data.constructorParameters}
            className="mt-5 mb-6"
          />
        )}

        {Object.keys(data.properties).length > 0 && (
          <PropertiesReferenceAccordion
            name={data.name}
            data={data.properties}
            className="mt-5 mb-6"
          />
        )}

        {Object.keys(instanceMethods).length > 0 && (
          <MethodsReferenceAccordion
            name={data.name}
            data={instanceMethods}
            className="mt-5 mb-6"
          />
        )}

        {additionalTypes && additionalTypes.length > 0 && (
          <AdditionalTypesAccordion data={additionalTypes} multiple={multiple} />
        )}
      </React.Fragment>
    );
  }

  // type.type === 'raw'
  return (
    <React.Fragment>
      {additionalTypes && additionalTypes.length > 0 && (
        <AdditionalTypesAccordion data={additionalTypes} multiple={multiple} />
      )}
    </React.Fragment>
  );
}
