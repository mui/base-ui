import { createLogOnce } from './createLogOnce';

export const warn = createLogOnce('warn', 'Base UI');

export { reset } from './createLogOnce';
