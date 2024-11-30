import { readFile } from 'node:fs/promises';
import { ComponentAPIReference } from 'docs/src/components/ApiReference';
import kebabCase from 'lodash/kebabCase';

export function getApiReferenceData(componentNames: string[]): Promise<ComponentAPIReference[]> {
  return Promise.all(
    componentNames.map(async (componentName) => {
      const kebabedComponentName = kebabCase(componentName);
      const apiDescriptionFilePath = `data/api/${kebabedComponentName}.json`;
      const translationsFilePath = `data/translations/api-docs/${kebabedComponentName}/${kebabedComponentName}.json`;

      const apiDescription = JSON.parse(await readFile(apiDescriptionFilePath, 'utf-8'));
      const translations = JSON.parse(await readFile(translationsFilePath, 'utf-8'));

      return {
        name: componentName,
        description: translations.componentDescription,
        props: Object.keys(apiDescription.props).map((propName) => ({
          name: propName,
          ...apiDescription.props[propName],
          defaultValue: apiDescription.props[propName].default ?? null,
          ...translations.propDescriptions[propName],
        })),
      } satisfies ComponentAPIReference;
    }),
  );
}
