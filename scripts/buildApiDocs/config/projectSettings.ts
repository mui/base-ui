import path from 'path';
import { ProjectSettings } from '@mui-internal/api-docs-builder';
import { getBaseUiComponentInfo } from './getBaseUiComponentInfo.js';

export const projectSettings: ProjectSettings = {
  typeScriptProjects: [
    {
      name: 'base',
      rootPath: path.join(process.cwd(), 'packages/react'),
      entryPointPath: 'src/index.ts',
      tsConfigPath: 'tsconfig.build.json',
    },
  ],
  baseApiUrl: 'https://base-ui.com',
  getComponentInfo: getBaseUiComponentInfo,
  translationPagesDirectory: 'docs/reference/temp/translations',

  // Disabled features
  generateClassName: () => '',
  generateJsonFileOnly: true,
  getApiPages: () => [],
  getComponentImports: () => [],
  isGlobalClassName: () => false,
  skipAnnotatingComponentDefinition: false,
  skipComponent: () => false,
  skipHook: () => true,
  skipSlotsAndClasses: true,
  translationLanguages: ['en'],
  output: {
    apiManifestPath: '',
    writeApiManifest: false,
  },
};
