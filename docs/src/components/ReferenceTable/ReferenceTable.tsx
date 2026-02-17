import * as React from 'react';
import type { TypesContentProps } from '@mui/internal-docs-infra/abstractCreateTypes';
import { useTypes } from '@mui/internal-docs-infra/useTypes';
import { ReferenceAccordion } from './ReferenceAccordion';
import { AttributesReferenceTable } from './AttributesReferenceTable';
import { CssVariablesReferenceTable } from './CssVariablesReferenceTable';
import { ParametersReferenceTable } from './ParametersReferenceTable';
import { PropertiesReferenceAccordion } from './PropertiesReferenceAccordion';
import { MethodsReferenceAccordion } from './MethodsReferenceAccordion';
import { AdditionalTypesAccordion } from './AdditionalTypesAccordion';

import '../Demo/CodeHighlighting.css';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mt-5 mb-3 text-base font-medium text-gray-900 dark:text-white">{children}</h4>
  );
}

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
          <AttributesReferenceTable
            name={data.name}
            data={data.dataAttributes}
            className="mt-5 mb-6"
          />
        )}

        {Object.keys(data.cssVariables).length > 0 && (
          <CssVariablesReferenceTable
            name={data.name}
            data={data.cssVariables}
            className="mt-5 mb-6"
          />
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

        {data.optionsProperties && (
          <React.Fragment>
            <SectionHeading>Parameters</SectionHeading>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              <code>
                <span className="pl-en">{data.optionsTypeName}</span>
              </code>
            </p>
            <ReferenceAccordion
              name={data.name}
              data={data.optionsProperties}
              nameLabel="Prop"
              caption="Parameter properties table"
              hideDefault
              className="mb-6"
            />
          </React.Fragment>
        )}

        {!data.optionsProperties && data.properties && Object.keys(data.properties).length > 0 && (
          <React.Fragment>
            <SectionHeading>Properties</SectionHeading>
            <ReferenceAccordion
              name={data.name}
              data={data.properties}
              nameLabel="Property"
              caption="Properties table"
              hideDefault
              className="mb-6"
            />
          </React.Fragment>
        )}

        {!data.optionsProperties &&
          !data.properties &&
          data.parameters &&
          Object.keys(data.parameters).length > 0 && (
            <ParametersReferenceTable
              name={data.name}
              data={data.parameters}
              className="mt-5 mb-6"
            />
          )}

        {data.returnValue && data.returnValue.kind === 'object' && (
          <React.Fragment>
            <SectionHeading>Return value</SectionHeading>
            {data.returnValue.typeName && (
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                <code>
                  <span className="pl-en">{data.returnValue.typeName}</span>
                </code>
              </p>
            )}
            <ReferenceAccordion
              name={data.name}
              data={data.returnValue.properties}
              nameLabel="Property"
              caption="Return value properties table"
              hideRequired
              hideDefault
              className="mb-6"
            />
          </React.Fragment>
        )}

        {data.returnValue && data.returnValue.kind === 'simple' && (
          <div className="mb-6">
            <SectionHeading>Return value</SectionHeading>
            {data.returnValue.type}
            {data.returnValue.detailedType && data.returnValue.detailedType}
          </div>
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

        {data.optionsProperties && (
          <React.Fragment>
            <SectionHeading>Parameters</SectionHeading>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              <code>
                <span className="pl-en">{data.optionsTypeName}</span>
              </code>
            </p>
            <ReferenceAccordion
              name={data.name}
              data={data.optionsProperties}
              nameLabel="Prop"
              caption="Parameter properties table"
              hideDefault
              className="mb-6"
            />
          </React.Fragment>
        )}

        {!data.optionsProperties && data.properties && Object.keys(data.properties).length > 0 && (
          <React.Fragment>
            <SectionHeading>Properties</SectionHeading>
            <ReferenceAccordion
              name={data.name}
              data={data.properties}
              nameLabel="Property"
              caption="Properties table"
              hideDefault
              className="mb-6"
            />
          </React.Fragment>
        )}

        {!data.optionsProperties &&
          !data.properties &&
          data.parameters &&
          Object.keys(data.parameters).length > 0 && (
            <React.Fragment>
              <SectionHeading>Parameters</SectionHeading>
              <ParametersReferenceTable name={data.name} data={data.parameters} className="mb-6" />
            </React.Fragment>
          )}

        {data.returnValue && data.returnValue.kind === 'object' && (
          <React.Fragment>
            <SectionHeading>Return value</SectionHeading>
            {data.returnValue.typeName && (
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                <code>
                  <span className="pl-en">{data.returnValue.typeName}</span>
                </code>
              </p>
            )}
            <ReferenceAccordion
              name={data.name}
              data={data.returnValue.properties}
              nameLabel="Property"
              caption="Return value properties table"
              hideRequired
              hideDefault
              className="mb-6"
            />
          </React.Fragment>
        )}

        {data.returnValue && data.returnValue.kind === 'simple' && (
          <div className="mb-6">
            <SectionHeading>Return value</SectionHeading>
            {data.returnValue.type}
            {data.returnValue.detailedType && data.returnValue.detailedType}
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
          <React.Fragment>
            <SectionHeading>Static methods</SectionHeading>
            <MethodsReferenceAccordion
              name={data.name}
              data={staticMethods}
              className="mb-6"
              methodLabel="Static method"
            />
          </React.Fragment>
        )}

        {Object.keys(data.constructorParameters).length > 0 && (
          <React.Fragment>
            <SectionHeading>Constructor parameters</SectionHeading>
            <ParametersReferenceTable
              name={data.name}
              data={data.constructorParameters}
              className="mb-6"
            />
          </React.Fragment>
        )}

        {Object.keys(data.properties).length > 0 && (
          <React.Fragment>
            <SectionHeading>Properties</SectionHeading>
            <PropertiesReferenceAccordion
              name={data.name}
              data={data.properties}
              className="mb-6"
            />
          </React.Fragment>
        )}

        {Object.keys(instanceMethods).length > 0 && (
          <React.Fragment>
            <SectionHeading>Methods</SectionHeading>
            <MethodsReferenceAccordion name={data.name} data={instanceMethods} className="mb-6" />
          </React.Fragment>
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
