import path from 'path';
import {
  ComponentInfo,
  extractPackageFile,
  parseFile,
} from '@mui-internal/api-docs-builder/buildApiUtils';
import startCase from 'lodash/startCase';
import urlJoin from 'url-join';

const overrides: Record<string, string> = {
  DirectionProvider: '/utils/direction-provider',
  RadioGroup: '/components/radio',
};

const baseUrl = 'https://base-ui.com/react';
const componentsDir = path.join(process.cwd(), 'packages/react/src/');

export function getBaseUiComponentInfo(filename: string): ComponentInfo {
  const { name } = extractPackageFile(filename);

  if (!name) {
    throw new Error(`Could not find the component name from: ${filename}`);
  }

  const parentComponentPath = filename.split(componentsDir)[1]!.split('/')[0];
  const parentComponentName = startCase(parentComponentPath);
  const componentUrl = overrides[name] ?? `/components/${parentComponentPath}`;
  const url = urlJoin(baseUrl, componentUrl);

  const customAnnotation = `Documentation: [Base UI ${parentComponentName}](${url})`;

  return {
    filename,
    name,
    muiName: name,
    apiPathname: name, // Not used, but we pass `name` just for logging when the script runs
    apiPagesDirectory: path.join(process.cwd(), 'docs/reference/temp/components'),
    isSystemComponent: false,
    readFile: () => parseFile(filename),
    getInheritance: () => null,
    getDemos: () => [{ demoPageTitle: name, demoPathname: url }],
    customAnnotation,
  };
}
