/* eslint-disable react/no-danger */
import * as React from 'react';
import classes from './ApiReference.module.css';

interface ComponentPropReference {
  name: string;
  type: {
    name: string;
    description: string | undefined;
  };
  defaultValue: string | null;
  description: string;
}

interface ComponentAPIReference {
  name: string;
  description: string | undefined;
  props: ComponentPropReference[];
}

export interface ApiReferenceProps {
  componentsApi: ComponentAPIReference[];
}

export function ApiReference(props: ApiReferenceProps) {
  const { componentsApi } = props;

  return (
    <div>
      <h2>API Reference</h2>
      <div>
        {componentsApi.map((apiDescription) => (
          <React.Fragment key={apiDescription.name}>
            <h3>{apiDescription.name}</h3>
            <p dangerouslySetInnerHTML={{ __html: apiDescription.description ?? '' }} />
            <div className={classes.propTable}>
              <table>
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '20%' }}>
                      Prop
                    </th>
                    <th scope="col" style={{ width: '20%' }}>
                      Type
                    </th>
                    <th scope="col" style={{ width: '20%' }}>
                      Default
                    </th>
                    <th scope="col" style={{ width: '40%' }}>
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {apiDescription.props.map((prop) => (
                    <tr key={prop.name}>
                      <th scope="row">
                        <code>{prop.name}</code>
                      </th>
                      <td>
                        <code>{prop.type.name}</code>
                      </td>
                      <td>{prop.defaultValue != null ? <code>{prop.defaultValue}</code> : null}</td>
                      {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                      <td dangerouslySetInnerHTML={{ __html: prop.description }} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
