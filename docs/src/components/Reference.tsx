import * as React from 'react';
import kebabCase from 'lodash/kebabCase';
import startCase from 'lodash/startCase';
import { join } from 'path';
import { readFileSync } from 'node:fs';
import { evaluateMdx } from 'docs/src/evaluate-mdx';
import { useMDXComponents } from 'docs/src/mdx-components';
import { rehypeSyntaxHighlighting } from 'docs/src/syntax-highlighting';
import { PropsTable } from './PropsTable';
import { AttributesTable } from './AttributesTable';

interface ReferenceProps {
  component: string;
  parts: string;
}

export interface ComponentDef {
  name: string;
  description?: string;
  props: Record<string, PropDef>;
  attributes?: Record<string, AttributeDef>;
}

export interface PropDef {
  type?: string;
  default?: string;
  required?: boolean;
  description?: string;
}

export interface AttributeDef {
  description?: string;
}

export function Reference({ component, parts }: ReferenceProps) {
  const componentDefs = parts.split(/,\s*/).map((part) => {
    const filename = `${kebabCase(component)}-${kebabCase(part)}.json`;
    const pathname = join(process.cwd(), 'reference/generated', filename);
    const jsonContents = readFileSync(pathname, 'utf-8');
    return JSON.parse(jsonContents) as ComponentDef;
  });

  return (
    <div>
      {componentDefs.map(async (def) => {
        const name = startCase(def.name.substring(component.length));
        return (
          <div key={def.name}>
            {await renderComponentInfo({
              heading: name,
              description: def.description,
            })}

            <PropsTable data={def.props} />

            {def.attributes && (
              <React.Fragment>
                <p className="mt-7 mb-4">
                  Use the following data attributes for styling the {name} part:
                </p>
                <AttributesTable data={def.attributes} />
              </React.Fragment>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface CreateMDXOptions {
  heading: string;
  description?: string;
}

async function renderComponentInfo({ heading, description = '' }: CreateMDXOptions) {
  const mdx = `### ${heading}\n${description}`;
  const Component = await evaluateMdx(mdx, {
    rehypePlugins: rehypeSyntaxHighlighting,
    useMDXComponents,
  });
  return <Component />;
}
