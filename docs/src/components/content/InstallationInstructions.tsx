import * as React from 'react';
import { PackageManagerSnippet, Npm, Pnpm, Yarn } from './PackageManagerSnippet';
import * as CodeBlock from '../CodeBlock';

export interface InstallationInstructionsProps {
  componentName: string | string[];
}

export function InstallationInstructions(props: InstallationInstructionsProps) {
  const { componentName } = props;

  let componentNames: string[];

  if (!Array.isArray(componentName)) {
    componentNames = [componentName];
  } else {
    componentNames = componentName;
  }

  return (
    <React.Fragment>
      <p>Base UI components are all available as a single package.</p>
      <PackageManagerSnippet>
        <Npm>npm install @base-ui-components/react</Npm>
        <Pnpm>pnpm add @base-ui-components/react</Pnpm>
        <Yarn>yarn add @base-ui-components/react</Yarn>
      </PackageManagerSnippet>
      <p>Once you have the package installed, import the component.</p>
      <CodeBlock.Root>
        <CodeBlock.Pre>
          {componentNames
            .map(
              (name) =>
                `import { ${name} } from '@base-ui-components/react/${name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}';`,
            )
            .join('\n')}
        </CodeBlock.Pre>
      </CodeBlock.Root>
    </React.Fragment>
  );
}
