import { userAgent } from './shared';

/** Running in jsdom or HappyDOM (used by unit tests). */
export const jsdom = /jsdom|HappyDOM/i.test(userAgent);
