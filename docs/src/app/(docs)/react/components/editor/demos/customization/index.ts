import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import CssModules from './css-modules';

export const DemoEditorCustomization = createDemoWithVariants(import.meta.url, { CssModules });
