'use client';
import * as React from 'react';
import { createCodeSandbox } from 'docs/src/blocks/createCodeSandbox/createCodeSandbox';
import { DemoFile } from 'docs/src/blocks/Demo';
import { Button } from './Button';

export function SandboxLink(props: SandboxLinkProps) {
  const { files, ...otherProps } = props;

  const handleClick = React.useCallback(() => {
    createCodeSandbox({
      demoFiles: files,
      demoLanguage: 'ts',
      title: 'Base UI experiment',
      dependencies: {
        react: '^19',
        'react-dom': '^19',
      },
      devDependencies: {
        '@types/react': '^19',
        '@types/react-dom': '^19',
        'react-scripts': 'latest',
      },
    });
  }, [files]);

  return (
    <Button {...otherProps} onClick={handleClick} variant="text" fullWidth>
      Open in CodeSandbox
    </Button>
  );
}

interface SandboxLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  files: DemoFile[];
}
