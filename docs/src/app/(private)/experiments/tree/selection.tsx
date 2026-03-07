'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import type { TreeItemModel } from '@base-ui/react/tree';
import styles from './tree.module.css';
import { SettingsMetadata, useExperimentSettings } from '../_components/SettingsPanel';

interface Settings extends Record<string, boolean> {}

export const settingsMetadata: SettingsMetadata<Settings> = {
  multiSelect: {
    type: 'boolean',
    label: 'Multi-select',
    default: true,
  },
  checkboxSelection: {
    type: 'boolean',
    label: 'Checkbox selection',
    default: true,
  },
  propagateToParents: {
    type: 'boolean',
    label: 'Propagate to parents',
    default: true,
  },
  propagateToDescendants: {
    type: 'boolean',
    label: 'Propagate to descendants',
    default: true,
  },
};

const items: TreeItemModel[] = [
  {
    id: 'frontend',
    label: 'Frontend',
    children: [
      {
        id: 'react',
        label: 'React',
        children: [
          { id: 'hooks', label: 'Hooks' },
          { id: 'components', label: 'Components' },
          { id: 'context', label: 'Context API' },
        ],
      },
      {
        id: 'vue',
        label: 'Vue',
        children: [
          { id: 'composition', label: 'Composition API' },
          { id: 'directives', label: 'Directives' },
        ],
      },
      { id: 'svelte', label: 'Svelte' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    children: [
      { id: 'node', label: 'Node.js' },
      { id: 'python', label: 'Python' },
      { id: 'go', label: 'Go' },
    ],
  },
  {
    id: 'devops',
    label: 'DevOps',
    children: [
      { id: 'docker', label: 'Docker' },
      { id: 'k8s', label: 'Kubernetes' },
      { id: 'ci-cd', label: 'CI/CD' },
    ],
  },
];

export default function SelectionTree() {
  const { settings } = useExperimentSettings<Settings>();

  return (
    <div className={styles.wrapper}>
      <div>
        <h3 className={styles.heading}>Selection</h3>
        <p className={styles.description}>
          {settings.checkboxSelection
            ? 'Use checkboxes to select. Shift+click for range selection.'
            : 'Click to select items. Hold Ctrl/Cmd for multi-select.'}
        </p>
      </div>
      <Tree.Root
        items={items}
        defaultExpandedItems={['frontend', 'react']}
        multiSelect={settings.multiSelect}
        selectionPropagation={{
          parents: settings.propagateToParents,
          descendants: settings.propagateToDescendants,
        }}
        className={styles.tree}
      >
        {(item) => (
          <Tree.Item className={styles.item} clickToSelect={!settings.checkboxSelection}>
            <Tree.ItemExpansionTrigger className={styles.expansionTrigger}>
              <ChevronIcon />
            </Tree.ItemExpansionTrigger>
            {settings.checkboxSelection && <Tree.ItemCheckbox className={styles.checkbox} />}
            <Tree.ItemLabel className={styles.label} />
          </Tree.Item>
        )}
      </Tree.Root>
    </div>
  );
}

function ChevronIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" {...props}>
      <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
