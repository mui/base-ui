import { expect } from 'vitest';
import { getDefaultFormSubmitter } from './getDefaultFormSubmitter';

describe('getDefaultFormSubmitter', () => {
  it('returns the first enabled submit button associated with the form', () => {
    document.body.innerHTML = [
      '<button id="external-before" form="test-form" type="submit">External before</button>',
      '<form id="test-form">',
      '  <input type="checkbox" />',
      '  <button id="internal" type="submit">Internal</button>',
      '</form>',
    ].join('');

    const form = document.querySelector<HTMLFormElement>('#test-form');

    expect(getDefaultFormSubmitter(form)).toBe(document.querySelector('#external-before'));
  });

  it('skips disabled submit buttons', () => {
    document.body.innerHTML = [
      '<form id="test-form">',
      '  <button id="disabled" type="submit" disabled>Disabled</button>',
      '  <button id="enabled" type="submit">Enabled</button>',
      '</form>',
    ].join('');

    const form = document.querySelector<HTMLFormElement>('#test-form');

    expect(getDefaultFormSubmitter(form)).toBe(document.querySelector('#enabled'));
  });

  it('supports input submitters from form.elements and ignores non-submit controls', () => {
    document.body.innerHTML = [
      '<form id="test-form">',
      '  <button id="button" type="button">Button</button>',
      '  <input id="reset" type="reset" />',
      '  <input id="image" type="image" />',
      '  <input id="submit" type="submit" />',
      '</form>',
    ].join('');

    const form = document.querySelector<HTMLFormElement>('#test-form');

    expect(getDefaultFormSubmitter(form)).toBe(document.querySelector('#submit'));
  });

  it('returns null when there is no default submitter', () => {
    document.body.innerHTML = [
      '<form id="test-form">',
      '  <input type="checkbox" />',
      '  <button type="button">Button</button>',
      '</form>',
    ].join('');

    const form = document.querySelector<HTMLFormElement>('#test-form');

    expect(getDefaultFormSubmitter(form)).toBe(null);
  });
});
