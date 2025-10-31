import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import CssModules from './css-modules';
import Tailwind from './tailwind';

export const DemoInputHero = createDemoWithVariants(import.meta.url, { CssModules, Tailwind });
