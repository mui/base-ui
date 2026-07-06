import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './preview';

// Apply the Storybook preview annotations (decorators, parameters) to vitest story tests.
const project = setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);

beforeAll(project.beforeAll);
