import * as React from 'react';

export interface InstallationInstructionsProps {
  importStatement: string;
}

export function InstallationInstructions(props: InstallationInstructionsProps) {
  const { importStatement } = props;

  return (
    <React.Fragment>
      Base UI components are all available as a single package.
      <pre>npm install @base_ui/react yarn add @base_ui/react pnpm add @base_ui/react</pre>
      Once you have the package installed, import the component.
      <pre>{importStatement}</pre>
    </React.Fragment>
  );
}
