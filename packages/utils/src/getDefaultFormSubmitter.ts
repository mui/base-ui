export type DefaultFormSubmitter = HTMLButtonElement | HTMLInputElement;

/**
 * Returns the submit button a browser uses for implicit form submission.
 *
 * This is useful for custom form controls that need to mirror native Enter key behavior.
 * Clicking the returned submitter preserves browser semantics such as the submitter's click
 * event, `SubmitEvent.submitter`, and submitter-specific attributes.
 *
 * The function follows the controls exposed by `form.elements`, which includes controls associated
 * through the `form` attribute in supported browsers.
 */
export function getDefaultFormSubmitter(form: HTMLFormElement | null): DefaultFormSubmitter | null {
  if (!form) {
    return null;
  }

  for (const candidate of form.elements) {
    if (candidate.matches(':disabled')) {
      continue;
    }

    const tagName = candidate.tagName;

    if (tagName === 'BUTTON') {
      const button = candidate as HTMLButtonElement;

      if (button.type === 'submit') {
        return button;
      }
    }

    if (tagName === 'INPUT') {
      const input = candidate as HTMLInputElement;

      if (input.type === 'submit' || input.type === 'image') {
        return input;
      }
    }
  }

  return null;
}
