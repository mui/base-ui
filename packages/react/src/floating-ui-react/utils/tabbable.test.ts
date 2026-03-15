import { isTabbable, tabbable } from './tabbable';

afterEach(() => {
  document.body.innerHTML = '';
});

test('includes slotted light DOM elements in the tab order', () => {
  const host = document.createElement('div');
  const shadowRoot = host.attachShadow({ mode: 'open' });
  const slot = document.createElement('slot');
  const button = document.createElement('button');

  shadowRoot.appendChild(slot);
  host.appendChild(button);
  document.body.appendChild(host);

  expect(tabbable(document.body)).toContain(button);
});

test('excludes unslotted light DOM elements from a shadow host tab order', () => {
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

test('keeps the summary tabbable but excludes closed details content', () => {
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

test('keeps aria-disabled elements in the tab order', () => {
  const element = document.createElement('div');

  element.tabIndex = 0;
  element.setAttribute('aria-disabled', 'true');
  document.body.append(element);

  expect(isTabbable(element)).to.equal(true);
  expect(tabbable(document.body)).toContain(element);
});

test('treats slotted elements inside inert shadow content as untabbable', () => {
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
