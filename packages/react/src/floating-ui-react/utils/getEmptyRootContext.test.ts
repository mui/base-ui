import { expect, test } from 'vitest';
import { getEmptyRootContext } from './getEmptyRootContext';

test('getEmptyRootContext creates isolated root contexts', () => {
  const firstContext = getEmptyRootContext();
  const secondContext = getEmptyRootContext();

  expect(firstContext).not.toBe(secondContext);
  expect(firstContext.context.events).not.toBe(secondContext.context.events);
  expect(firstContext.context.dataRef).not.toBe(secondContext.context.dataRef);
  expect(firstContext.context.triggerElements).not.toBe(secondContext.context.triggerElements);

  firstContext.context.triggerElements.add('trigger-1', document.createElement('button'));

  expect(firstContext.context.triggerElements.size).toBe(1);
  expect(secondContext.context.triggerElements.size).toBe(0);
});
