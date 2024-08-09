import path from 'path';
import { ProjectSettings } from '@mui-internal/api-docs-builder';
import findApiPages from '@mui-internal/api-docs-builder/utils/findApiPages';
import { getBaseUiComponentInfo } from './getBaseUiComponentInfo';
import { getBaseUiHookInfo } from './getBaseUiHookInfo';
import { getComponentImports } from './getComponentImports';

export const projectSettings: ProjectSettings = {
  output: {
    apiManifestPath: path.join(process.cwd(), 'docs/data/base/pagesApi.js'),
    writeApiManifest: false,
  },
  typeScriptProjects: [
    {
      name: 'base',
      rootPath: path.join(process.cwd(), 'packages/mui-base'),
      entryPointPath: 'src/index.ts',
      tsConfigPath: 'tsconfig.build.json',
    },
  ],
  getApiPages: () => findApiPages('docs/data/base/api'),
  getComponentInfo: getBaseUiComponentInfo,
  getComponentImports,
  getHookInfo: getBaseUiHookInfo,
  getHookImports: getComponentImports,
  translationLanguages: ['en'],
  skipComponent: () => false,
  skipAnnotatingComponentDefinition: true,
  skipSlotsAndClasses: true,
  generateJsonFileOnly: true,
  translationPagesDirectory: 'docs/data/base/translations/api-docs',
  generateClassName: () => '',
  isGlobalClassName: () => false,
};
