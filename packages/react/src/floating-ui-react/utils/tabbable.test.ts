import { isTabbable, tabbable } from './tabbable';

afterEach(() => {
  document.body.innerHTML = '';
});

it('includes basic tabbable controls and excludes hidden inputs', () => {
  const button = document.createElement('button');
  const input = document.createElement('input');
  const hiddenInput = document.createElement('input');

  hiddenInput.type = 'hidden';
  document.body.append(button, input, hiddenInput);

  expect(tabbable(document.body)).toEqual([button, input]);
});

it('includes embedded focusable elements in the tab order', () => {
  const iframe = document.createElement('iframe');

  document.body.append(iframe);

  expect(tabbable(document.body)).toContain(iframe);
});

it('excludes disabled controls from the tab order', () => {
  const enabledButton = document.createElement('button');
  const disabledButton = document.createElement('button');

  disabledButton.disabled = true;
  document.body.append(enabledButton, disabledButton);

  expect(tabbable(document.body)).toEqual([enabledButton]);
});

it('includes slotted light DOM elements in the tab order', () => {
  const host = document.createElement('div');
  const shadowRoot = host.attachShadow({ mode: 'open' });
  const slot = document.createElement('slot');
  const button = document.createElement('button');

  shadowRoot.appendChild(slot);
  host.appendChild(button);
  document.body.appendChild(host);

  expect(tabbable(document.body)).toContain(button);
});

it('excludes unslotted light DOM elements from a shadow host tab order', () => {
  const host = document.createElement('div');
  const shadowRoot = host.attachShadow({ mode: 'open' });
  const shadowButton = document.createElement('button');
  const hiddenLightButton = document.createElement('button');

  shadowRoot.appendChild(shadowButton);
  host.appendChild(hiddenLightButton);
  document.body.appendChild(host);

  const tabbableElements = tabbable(document.body);

  expect(tabbableElements).toContain(shadowButton);
  expect(tabbableElements).not.toContain(hiddenLightButton);
});

it('keeps the summary tabbable but excludes closed details content', () => {
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  const button = document.createElement('button');

  summary.textContent = 'Summary';
  button.textContent = 'Hidden';
  details.append(summary, button);
  document.body.append(details);

  expect(tabbable(document.body)).toContain(summary);
  expect(tabbable(document.body)).not.toContain(button);
});

it('keeps aria-disabled elements in the tab order', () => {
  const element = document.createElement('div');

  element.tabIndex = 0;
  element.setAttribute('aria-disabled', 'true');
  document.body.append(element);

  expect(isTabbable(element)).toBe(true);
  expect(tabbable(document.body)).toContain(element);
});

it('uses checkVisibility to exclude hidden elements from the tab order', () => {
  const button = document.createElement('button');

  button.style.visibility = 'hidden';
  Object.defineProperty(button, 'checkVisibility', {
    configurable: true,
    value: () => false,
  });
  document.body.append(button);

  expect(isTabbable(button)).toBe(false);
  expect(tabbable(document.body)).not.toContain(button);
});

it('keeps only the checked radio in a named group', () => {
  const firstRadio = document.createElement('input');
  const checkedRadio = document.createElement('input');
  const button = document.createElement('button');

  firstRadio.type = 'radio';
  firstRadio.name = 'group';
  checkedRadio.type = 'radio';
  checkedRadio.name = 'group';
  checkedRadio.checked = true;

  document.body.append(firstRadio, checkedRadio, button);

  const tabbableElements = tabbable(document.body);

  expect(tabbableElements).not.toContain(firstRadio);
  expect(tabbableElements).toContain(checkedRadio);
  expect(tabbableElements).toContain(button);
});

it('keeps only the first radio when a named group has no checked item', () => {
  const firstRadio = document.createElement('input');
  const secondRadio = document.createElement('input');

  firstRadio.type = 'radio';
  firstRadio.name = 'group';
  secondRadio.type = 'radio';
  secondRadio.name = 'group';

  document.body.append(firstRadio, secondRadio);

  const tabbableElements = tabbable(document.body);

  expect(tabbableElements).toContain(firstRadio);
  expect(tabbableElements).not.toContain(secondRadio);
});

it('treats slotted elements inside inert shadow content as untabbable', () => {
  const host = document.createElement('div');
  const shadowRoot = host.attachShadow({ mode: 'open' });
  const wrapper = document.createElement('div');
  const slot = document.createElement('slot');
  const button = document.createElement('button');

  wrapper.setAttribute('inert', '');
  wrapper.appendChild(slot);
  shadowRoot.appendChild(wrapper);
  host.appendChild(button);
  document.body.appendChild(host);

  expect(tabbable(document.body)).not.toContain(button);
});
