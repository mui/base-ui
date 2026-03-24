'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Tabs } from '@base-ui/react/tabs';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { usePackageManagerSnippetContext } from 'docs/src/blocks/PackageManagerSnippet/PackageManagerSnippetProvider';
import * as CodeBlock from '../CodeBlock';
import { Code } from '../Code';
import { INSTALLATION_PACKAGE_MANAGERS } from './model';
import './InstallationBlock.css';

interface InstallationBlockProps {
  package: string;
  className?: string;
}

export function InstallationBlock(props: InstallationBlockProps) {
  const packageManagers = INSTALLATION_PACKAGE_MANAGERS;
  const { packageManager: globalPreference, setPackageManager: setGlobalPreference } =
    usePackageManagerSnippetContext();
  const initialPackageManager = packageManagers[0];
  const [value, setValue] = React.useState<string>(initialPackageManager?.value ?? '');

  useIsoLayoutEffect(() => {
    if (!initialPackageManager) {
      return;
    }

    if (packageManagers.some((pm) => pm.value === globalPreference)) {
      setValue(globalPreference);
    }
  }, [globalPreference, initialPackageManager, packageManagers]);

  const handleValueChange = useStableCallback((newValue: string) => {
    setValue(newValue);
    setGlobalPreference(newValue);
  });

  return (
    <Tabs.Root
      className={clsx('InstallationBlock', props.className)}
      value={value}
      onValueChange={handleValueChange}
    >
      <CodeBlock.Root>
        <CodeBlock.Panel>
          <span className="sr-only">Installation command</span>
          <Tabs.List className="InstallationBlockTabsList" aria-label="Package manager">
            {packageManagers.map((pm) => (
              <Tabs.Tab key={pm.value} value={pm.value} className="InstallationBlockTab">
                <span className="InstallationBlockTabLabel" data-text={pm.label}>
                  {pm.label}
                </span>
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </CodeBlock.Panel>

        {packageManagers.map((pm) => (
          <Tabs.Panel key={pm.value} value={pm.value}>
            <CodeBlock.Pre data-language="bash">
              <Code data-language="bash">
                <span data-line>
                  <span className="pl-en">{pm.value}</span>{' '}
                  <span className="pl-smi">{pm.command}</span>{' '}
                  <span className="pl-s">{props.package}</span>
                </span>
              </Code>
            </CodeBlock.Pre>
          </Tabs.Panel>
        ))}
      </CodeBlock.Root>
    </Tabs.Root>
  );
}
