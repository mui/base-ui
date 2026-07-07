import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Form } from '@base-ui/react/form';
import { Field } from '@base-ui/react/field';
import { NumberField } from '@base-ui/react/number-field';
import { Button } from '@base-ui/react/button';
import styles from './form.module.css';

/**
 * Stories follow research/c-components/form (Tier 1): the kept docs demos (hero,
 * Server Function action, Zod-style schema mapping) plus one story per documented
 * use case — submit gating with focus-first-invalid, the `errors` prop lifecycle,
 * `onFormSubmit` payload assembly, the `validationMode` cascade, imperative
 * validation via `actionsRef`, the `noValidate` boundary, and a react-hook-form
 * style integration.
 */
const meta = {
  title: 'Form inputs/Form',
  component: Form,
  tags: ['ai-generated'],
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Hero (docs demo)                                                    */
/* ------------------------------------------------------------------ */

async function submitUrlForm(value: string) {
  // Mimic a server response (docs hero demo, shortened delay for tests)
  await new Promise((resolve) => {
    setTimeout(resolve, 300);
  });

  try {
    const url = new URL(value);

    if (url.hostname.endsWith('example.com')) {
      return { error: 'The example domain is not allowed' };
    }
  } catch {
    return { error: 'This is not a valid URL' };
  }

  return { error: undefined };
}

function HeroExample() {
  const [errors, setErrors] = React.useState<Form.Props['errors']>({});
  const [loading, setLoading] = React.useState(false);

  return (
    <Form
      className={styles.Form}
      errors={errors}
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const value = formData.get('url') as string;

        setLoading(true);
        const response = await submitUrlForm(value);
        setErrors(response.error ? { url: response.error } : {});
        setLoading(false);
      }}
    >
      <Field.Root name="url" className={styles.Field}>
        <Field.Label className={styles.Label}>Homepage</Field.Label>
        <Field.Control
          type="url"
          required
          defaultValue="https://example.com"
          placeholder="https://example.com"
          pattern="https?://.*"
          className={styles.Input}
        />
        <Field.Error className={styles.Error} />
      </Field.Root>
      <Button type="submit" disabled={loading} focusableWhenDisabled className={styles.Button}>
        Submit
      </Button>
    </Form>
  );
}

/**
 * The docs hero demo: a URL field with native constraints (`required`, `type="url"`,
 * `pattern`) submitted to a mock server whose error lands in the `errors` prop.
 * Editing the field clears the server error optimistically.
 */
export const Hero: Story = {
  render: () => <HeroExample />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Homepage');
    await expect(input).toHaveValue('https://example.com');

    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByText('The example domain is not allowed')).toBeVisible();

    // Server errors auto-clear as soon as the field value changes (#3136).
    await userEvent.type(input, 'x');
    await waitFor(async () => {
      await expect(canvas.queryByText('The example domain is not allowed')).not.toBeInTheDocument();
    });
  },
};

/* ------------------------------------------------------------------ */
/* Submit gate flow                                                    */
/* ------------------------------------------------------------------ */

function SubmitGateExample() {
  const [payload, setPayload] = React.useState<string | null>(null);
  return (
    <Form
      className={styles.Form}
      onFormSubmit={(formValues: { email: string; password: string }) => {
        setPayload(JSON.stringify(formValues));
      }}
    >
      <Field.Root name="email" className={styles.Field}>
        <Field.Label className={styles.Label}>Email</Field.Label>
        <Field.Control type="email" required placeholder="e.g. alice@example.com" className={styles.Input} />
        <Field.Error className={styles.Error} match="valueMissing">
          Please enter your email.
        </Field.Error>
        <Field.Error className={styles.Error} match="typeMismatch">
          Enter a valid email address.
        </Field.Error>
      </Field.Root>
      <Field.Root name="password" className={styles.Field}>
        <Field.Label className={styles.Label}>Password</Field.Label>
        <Field.Control type="password" required pattern=".{8,}" className={styles.Input} />
        <Field.Error className={styles.Error} match="valueMissing">
          Please enter a password.
        </Field.Error>
        <Field.Error className={styles.Error} match="patternMismatch">
          Password must be at least 8 characters.
        </Field.Error>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Sign in
      </button>
      {payload ? <output className={styles.Output}>{payload}</output> : null}
    </Form>
  );
}

/**
 * The full submission gate: submitting with invalid fields renders every error,
 * blocks the submit, and focuses the first invalid control; once fields are fixed
 * (errors clear live after the first attempt), `onFormSubmit` receives the values.
 */
export const SubmitFlowWithErrors: Story = {
  render: () => <SubmitGateExample />,
  play: async ({ canvas, userEvent }) => {
    const email = canvas.getByLabelText('Email');
    const password = canvas.getByLabelText('Password');
    const submit = canvas.getByRole('button', { name: 'Sign in' });

    // Submitting empty required fields is blocked: both errors render,
    // focus lands on the first invalid control, and no output appears.
    await userEvent.click(submit);
    await expect(await canvas.findByText('Please enter your email.')).toBeVisible();
    await expect(canvas.getByText('Please enter a password.')).toBeVisible();
    await expect(email).toHaveFocus();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();

    // After the first submit attempt, fixing a field clears its error live.
    await userEvent.type(email, 'alice@example.com');
    await waitFor(async () => {
      await expect(canvas.queryByText('Please enter your email.')).not.toBeInTheDocument();
    });

    // Re-submitting focuses the next remaining invalid control.
    await userEvent.click(submit);
    await waitFor(async () => {
      await expect(password).toHaveFocus();
    });

    // A too-short password trips the pattern constraint while typing...
    await userEvent.type(password, 'abc');
    await expect(await canvas.findByText('Password must be at least 8 characters.')).toBeVisible();

    // ...and once valid, submission goes through to onFormSubmit.
    await userEvent.type(password, 'defgh123');
    await userEvent.click(submit);
    await expect(await canvas.findByText(/"email":"alice@example.com"/)).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Server errors                                                       */
/* ------------------------------------------------------------------ */

function ServerErrorsExample() {
  const [errors, setErrors] = React.useState<Form.Props['errors']>({
    username: 'This username is already taken',
  });
  return (
    <Form className={styles.Form} errors={errors}>
      <Field.Root name="username" className={styles.Field}>
        <Field.Label className={styles.Label}>Username</Field.Label>
        <Field.Control defaultValue="admin" className={styles.Input} />
        <Field.Error className={styles.Error} />
      </Field.Root>
      <button
        type="button"
        className={styles.Button}
        onClick={() => setErrors({ username: 'This username is already taken' })}
      >
        Simulate server response
      </button>
    </Form>
  );
}

/**
 * The `errors` prop distributes external errors to Fields by `name`. Entries
 * auto-clear the moment the user edits the field — there is no `onClearErrors`
 * anymore (#3136) — and the app can re-set the prop at any time.
 */
export const ServerErrorsProp: Story = {
  render: () => <ServerErrorsExample />,
  play: async ({ canvas, userEvent }) => {
    // An externally supplied error renders immediately through Field.Error.
    await expect(canvas.getByText('This username is already taken')).toBeVisible();

    // Editing the field optimistically clears it without any callback wiring.
    await userEvent.type(canvas.getByLabelText('Username'), 'x');
    await waitFor(async () => {
      await expect(canvas.queryByText('This username is already taken')).not.toBeInTheDocument();
    });

    // Passing a new errors object repaints the message.
    await userEvent.click(canvas.getByRole('button', { name: 'Simulate server response' }));
    await expect(await canvas.findByText('This username is already taken')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Server Function / useActionState                                    */
/* ------------------------------------------------------------------ */

interface ActionState {
  serverErrors?: Form.Props['errors'];
}

// Mark this as a Server Function with 'use server' in a supporting framework like Next.js
async function submitUsernameAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  // Mimic a server response (docs form-action demo, made deterministic for tests)
  await new Promise((resolve) => {
    setTimeout(resolve, 300);
  });

  const username = formData.get('username') as string | null;

  if (username === 'admin') {
    return { serverErrors: { username: "'admin' is reserved for system use" } };
  }

  return {};
}

function ServerFunctionExample() {
  const [state, formAction, loading] = React.useActionState<ActionState, FormData>(
    submitUsernameAction,
    {},
  );

  return (
    <Form errors={state.serverErrors} action={formAction} className={styles.Form}>
      <Field.Root name="username" className={styles.Field}>
        <Field.Label className={styles.Label}>Username</Field.Label>
        <Field.Control
          type="text"
          autoComplete="username"
          required
          defaultValue="admin"
          placeholder="e.g. alice132"
          className={styles.Input}
        />
        <Field.Error className={styles.Error} />
      </Field.Root>
      <Button type="submit" disabled={loading} focusableWhenDisabled className={styles.Button}>
        Submit
      </Button>
    </Form>
  );
}

/**
 * The docs `form-action` demo shape: `useActionState` supplies `action` and the
 * returned server errors feed the `errors` prop — viable precisely because errors
 * auto-clear on change (#3136). After submission lands, Form focuses the invalid field.
 */
export const ServerFunctionAction: Story = {
  render: () => <ServerFunctionExample />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Username');

    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByText("'admin' is reserved for system use")).toBeVisible();

    // After a submitted form receives new errors, the first invalid field is focused.
    await waitFor(async () => {
      await expect(input).toHaveFocus();
    });

    // Typing clears the server error optimistically.
    await userEvent.type(input, 'x');
    await waitFor(async () => {
      await expect(canvas.queryByText("'admin' is reserved for system use")).not.toBeInTheDocument();
    });
  },
};

/* ------------------------------------------------------------------ */
/* Schema validation at submit (Zod shape)                             */
/* ------------------------------------------------------------------ */

/**
 * Stand-in for the docs Zod demo without the dependency: `z.flattenError(result.error)
 * .fieldErrors` produces exactly this shape — arrays of messages keyed by field name.
 */
function safeParseProfile(values: Form.Values) {
  const fieldErrors: Record<string, string[]> = {};

  if (typeof values.name !== 'string' || values.name.length < 1) {
    fieldErrors.name = ['Name is required'];
  }

  const age = Number(values.age);
  if (Number.isNaN(age)) {
    fieldErrors.age = ['Age must be a number'];
  } else if (age <= 0) {
    fieldErrors.age = ['Age must be a positive number'];
  }

  const success = Object.keys(fieldErrors).length === 0;
  return { success, fieldErrors };
}

function SchemaMappingExample() {
  const [errors, setErrors] = React.useState<Form.Props['errors']>({});
  const [result, setResult] = React.useState<string | null>(null);

  return (
    <Form
      className={styles.Form}
      errors={errors}
      onFormSubmit={(formValues) => {
        const parsed = safeParseProfile(formValues);
        setErrors(parsed.fieldErrors);
        setResult(parsed.success ? `Valid: ${JSON.stringify(formValues)}` : null);
      }}
    >
      <Field.Root name="name" className={styles.Field}>
        <Field.Label className={styles.Label}>Name</Field.Label>
        <Field.Control placeholder="Enter name" className={styles.Input} />
        <Field.Error className={styles.Error} />
      </Field.Root>
      <Field.Root name="age" className={styles.Field}>
        <Field.Label className={styles.Label}>Age</Field.Label>
        <Field.Control placeholder="Enter age" className={styles.Input} />
        <Field.Error className={styles.Error} />
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Submit
      </button>
      {result ? <output className={styles.Output}>{result}</output> : null}
    </Form>
  );
}

/**
 * Schema validation at submit time, mapped into `errors` (the docs "Using with Zod"
 * flow): parse in `onFormSubmit`, feed `fieldErrors` to the prop. Fixing one field
 * clears only that field's error.
 */
export const ZodSchemaMapping: Story = {
  render: () => <SchemaMappingExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByText('Name is required')).toBeVisible();
    await expect(canvas.getByText('Age must be a positive number')).toBeVisible();

    // Fixing only the name clears only the name's error; the age error stays.
    await userEvent.type(canvas.getByLabelText('Name'), 'Jane');
    await waitFor(async () => {
      await expect(canvas.queryByText('Name is required')).not.toBeInTheDocument();
    });
    await expect(canvas.getByText('Age must be a positive number')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* onFormSubmit payload                                                */
/* ------------------------------------------------------------------ */

function PayloadExample() {
  const [payload, setPayload] = React.useState<string | null>(null);
  return (
    <Form
      className={styles.Form}
      onFormSubmit={(formValues: { id: string; quantity: number }) => {
        setPayload(JSON.stringify(formValues, null, 2));
      }}
    >
      <Field.Root name="id" className={styles.Field}>
        <Field.Label className={styles.Label}>Product ID</Field.Label>
        <Field.Control required placeholder="e.g. A-1042" className={styles.Input} />
        <Field.Error className={styles.Error} match="valueMissing">
          Enter a product ID.
        </Field.Error>
      </Field.Root>
      <Field.Root name="quantity" className={styles.Field}>
        <NumberField.Root defaultValue={1000} locale="en-US" className={styles.Field}>
          <Field.Label className={styles.Label}>Quantity</Field.Label>
          <NumberField.Input className={styles.Input} />
        </NumberField.Root>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Create order
      </button>
      {payload ? <pre className={styles.Pre}>{payload}</pre> : null}
    </Form>
  );
}

/**
 * `onFormSubmit` assembles registered field values into a typed JS object and
 * auto-`preventDefault()`s — for JSON APIs instead of FormData (#3131). NumberField
 * contributes its raw numeric value, not the formatted display string (#1957).
 */
export const OnFormSubmitPayload: Story = {
  render: () => <PayloadExample />,
  play: async ({ canvas, userEvent }) => {
    const quantity = canvas.getByLabelText('Quantity');

    // The input displays the locale-formatted string...
    await expect(quantity).toHaveValue('1,000');

    await userEvent.type(canvas.getByLabelText('Product ID'), 'A-1042');
    await userEvent.click(canvas.getByRole('button', { name: 'Create order' }));

    // ...but the submitted payload carries the raw number.
    await expect(await canvas.findByText(/"quantity": 1000/)).toBeVisible();
    await expect(canvas.getByText(/"id": "A-1042"/)).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* validationMode cascade                                              */
/* ------------------------------------------------------------------ */

function ValidationModeExample() {
  return (
    <Form className={styles.Form} validationMode="onChange">
      <Field.Root name="nickname" className={styles.Field}>
        <Field.Label className={styles.Label}>Nickname</Field.Label>
        <Field.Control required placeholder="Validates on change (inherited)" className={styles.Input} />
        <Field.Error className={styles.Error} match="valueMissing">
          Nickname is required.
        </Field.Error>
      </Field.Root>
      <Field.Root name="city" validationMode="onBlur" className={styles.Field}>
        <Field.Label className={styles.Label}>City</Field.Label>
        <Field.Control required placeholder="Validates on blur (own mode)" className={styles.Input} />
        <Field.Error className={styles.Error} match="valueMissing">
          City is required.
        </Field.Error>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Save profile
      </button>
    </Form>
  );
}

/**
 * `validationMode` set once on Form cascades to every Field; a Field's own
 * `validationMode` takes precedence (JSDoc contract, #3013). Nickname inherits
 * `onChange`; City overrides with `onBlur`.
 */
export const ValidationModeCascade: Story = {
  render: () => <ValidationModeExample />,
  play: async ({ canvas, userEvent }) => {
    const nickname = canvas.getByLabelText('Nickname');
    const city = canvas.getByLabelText('City');

    // The inherited onChange mode validates while typing.
    await userEvent.type(nickname, 'a');
    await userEvent.clear(nickname);
    await expect(await canvas.findByText('Nickname is required.')).toBeVisible();

    // The Field-level onBlur override wins: no error while typing...
    await userEvent.type(city, 'b');
    await userEvent.keyboard('{Backspace}');
    await expect(canvas.queryByText('City is required.')).not.toBeInTheDocument();

    // ...until focus leaves the control.
    await userEvent.tab();
    await expect(await canvas.findByText('City is required.')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Imperative validation                                               */
/* ------------------------------------------------------------------ */

function ImperativeValidationExample() {
  const actionsRef = React.useRef<Form.Actions>(null);
  return (
    <Form className={styles.Form} actionsRef={actionsRef}>
      <Field.Root name="email" className={styles.Field}>
        <Field.Label className={styles.Label}>Email</Field.Label>
        <Field.Control type="email" required placeholder="e.g. alice@example.com" className={styles.Input} />
        <Field.Error className={styles.Error} match="valueMissing">
          Email is required.
        </Field.Error>
      </Field.Root>
      <Field.Root name="fullName" className={styles.Field}>
        <Field.Label className={styles.Label}>Full name</Field.Label>
        <Field.Control required placeholder="e.g. Alice Cooper" className={styles.Input} />
        <Field.Error className={styles.Error} match="valueMissing">
          Full name is required.
        </Field.Error>
      </Field.Root>
      <div className={styles.Row}>
        <button
          type="button"
          className={styles.Button}
          onClick={() => actionsRef.current?.validate('email')}
        >
          Validate email
        </button>
        <button type="button" className={styles.Button} onClick={() => actionsRef.current?.validate()}>
          Validate all
        </button>
      </div>
    </Form>
  );
}

/**
 * `actionsRef.current.validate(fieldName?)` triggers validation outside the submit
 * event — for initial validation or wizard steps (#3395, asked in #3323). One name
 * validates a single field; no argument validates all of them.
 */
export const ImperativeValidation: Story = {
  render: () => <ImperativeValidationExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Validate email' }));
    await expect(await canvas.findByText('Email is required.')).toBeVisible();
    await expect(canvas.queryByText('Full name is required.')).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Validate all' }));
    await expect(await canvas.findByText('Full name is required.')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* noValidate boundary                                                 */
/* ------------------------------------------------------------------ */

/**
 * Base UI Form sets `noValidate` by default so Field.Error owns the message UI;
 * a plain `<form>` around Base UI controls keeps native browser bubbles unless you
 * add `noValidate` yourself — the #3552 trap. Submit each form to compare.
 */
export const NoValidateBoundary: Story = {
  render: () => (
    <div className={styles.Row}>
      <Form aria-label="Base UI form" className={styles.Form}>
        <Field.Root name="email" className={styles.Field}>
          <Field.Label className={styles.Label}>Email (Base UI Form)</Field.Label>
          <Field.Control type="email" required placeholder="Field.Error renders the message" className={styles.Input} />
          <Field.Error className={styles.Error} match="valueMissing">
            Email is required.
          </Field.Error>
        </Field.Root>
        <button type="submit" className={styles.Button}>
          Subscribe
        </button>
      </Form>
      <form aria-label="Plain form" className={styles.Form}>
        <div className={styles.Field}>
          <label className={styles.Label} htmlFor="plain-email">
            Email (plain form)
          </label>
          <input
            id="plain-email"
            name="email"
            type="email"
            required
            placeholder="Browser bubble on submit"
            className={styles.Input}
          />
        </div>
        <button type="submit" className={styles.Button} onClick={(event) => event.preventDefault()}>
          Subscribe
        </button>
      </form>
    </div>
  ),
  play: async ({ canvas }) => {
    const baseUiForm = canvas.getByRole('form', { name: 'Base UI form' });
    const plainForm = canvas.getByRole('form', { name: 'Plain form' });

    // Base UI suppresses native bubbles in favor of Field.Error...
    await expect(baseUiForm).toHaveAttribute('novalidate');

    // ...while a plain <form> keeps them unless you add noValidate yourself (#3552).
    await expect(plainForm).not.toHaveAttribute('novalidate');
  },
};

/* ------------------------------------------------------------------ */
/* react-hook-form style integration                                   */
/* ------------------------------------------------------------------ */

interface RhfRules {
  required?: string;
  minLength?: { value: number; message: string };
}

interface RhfFieldState {
  invalid: boolean;
  isTouched: boolean;
  isDirty: boolean;
  error?: { message: string };
}

interface RhfField {
  name: string;
  value: string;
  ref: (element: HTMLInputElement | null) => void;
  onChange: (value: string) => void;
  onBlur: () => void;
}

/**
 * Dependency-free re-creation of the react-hook-form `useForm`/`Controller` contract
 * used by the forms handbook demo (docs/src/app/(docs)/react/handbook/forms/demos/
 * react-hook-form): per-field `field`/`fieldState` objects, `handleSubmit(onValid)`,
 * submit-time validation with focus-on-first-error, and revalidation on change.
 */
function useMiniHookForm<T extends Record<string, string>>(config: {
  defaultValues: T;
  rules: Partial<Record<keyof T & string, RhfRules>>;
}) {
  const { defaultValues, rules } = config;
  const [values, setValues] = React.useState<T>(defaultValues);
  const [errors, setErrors] = React.useState<Partial<Record<keyof T & string, string>>>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof T & string, boolean>>>({});
  const submittedRef = React.useRef(false);
  const controlsRef = React.useRef(new Map<string, HTMLInputElement>());

  function validate(name: keyof T & string, value: string): string | undefined {
    const fieldRules = rules[name];
    if (!fieldRules) {
      return undefined;
    }
    if (fieldRules.required && value.trim() === '') {
      return fieldRules.required;
    }
    if (fieldRules.minLength && value.length < fieldRules.minLength.value) {
      return fieldRules.minLength.message;
    }
    return undefined;
  }

  function handleSubmit(onValid: (data: T) => void) {
    return (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submittedRef.current = true;

      const names = Object.keys(defaultValues) as Array<keyof T & string>;
      const nextErrors: Partial<Record<keyof T & string, string>> = {};
      for (const name of names) {
        const message = validate(name, values[name]);
        if (message) {
          nextErrors[name] = message;
        }
      }
      setErrors(nextErrors);

      const firstInvalid = names.find((name) => nextErrors[name]);
      if (firstInvalid) {
        // Mirrors react-hook-form's shouldFocusError via the forwarded control ref.
        controlsRef.current.get(firstInvalid)?.focus();
      } else {
        onValid(values);
      }
    };
  }

  function controller(name: keyof T & string): { field: RhfField; fieldState: RhfFieldState } {
    const error = errors[name];
    return {
      field: {
        name,
        value: values[name],
        ref: (element) => {
          if (element) {
            controlsRef.current.set(name, element);
          } else {
            controlsRef.current.delete(name);
          }
        },
        onChange: (value) => {
          setValues((previous) => ({ ...previous, [name]: value }));
          if (submittedRef.current) {
            setErrors((previous) => ({ ...previous, [name]: validate(name, value) }));
          }
        },
        onBlur: () => {
          setTouched((previous) => ({ ...previous, [name]: true }));
        },
      },
      fieldState: {
        invalid: Boolean(error),
        isTouched: Boolean(touched[name]),
        isDirty: values[name] !== defaultValues[name],
        error: error ? { message: error } : undefined,
      },
    };
  }

  return { controller, handleSubmit };
}

function ReactHookFormStyleExample() {
  const [result, setResult] = React.useState<string | null>(null);
  const { controller, handleSubmit } = useMiniHookForm({
    defaultValues: { serverName: '', region: '' },
    rules: {
      serverName: {
        required: 'This field is required.',
        minLength: { value: 3, message: 'At least 3 characters.' },
      },
      region: { required: 'This field is required.' },
    },
  });

  const serverName = controller('serverName');
  const region = controller('region');

  return (
    <Form
      className={styles.Form}
      aria-label="Launch new cloud server"
      onSubmit={handleSubmit((data) => {
        setResult(`Launching ${data.serverName} in ${data.region}`);
      })}
    >
      <Field.Root
        name={serverName.field.name}
        invalid={serverName.fieldState.invalid}
        touched={serverName.fieldState.isTouched}
        dirty={serverName.fieldState.isDirty}
        className={styles.Field}
      >
        <Field.Label className={styles.Label}>Server name</Field.Label>
        <Field.Control
          ref={serverName.field.ref}
          value={serverName.field.value}
          onValueChange={serverName.field.onChange}
          onBlur={serverName.field.onBlur}
          placeholder="e.g. api-server-01"
          className={styles.Input}
        />
        <Field.Description className={styles.Description}>
          Must be 3 or more characters long
        </Field.Description>
        <Field.Error className={styles.Error} match={Boolean(serverName.fieldState.error)}>
          {serverName.fieldState.error?.message}
        </Field.Error>
      </Field.Root>
      <Field.Root
        name={region.field.name}
        invalid={region.fieldState.invalid}
        touched={region.fieldState.isTouched}
        dirty={region.fieldState.isDirty}
        className={styles.Field}
      >
        <Field.Label className={styles.Label}>Region</Field.Label>
        <Field.Control
          ref={region.field.ref}
          value={region.field.value}
          onValueChange={region.field.onChange}
          onBlur={region.field.onBlur}
          placeholder="e.g. eu-central-1"
          className={styles.Input}
        />
        <Field.Error className={styles.Error} match={Boolean(region.fieldState.error)}>
          {region.fieldState.error?.message}
        </Field.Error>
      </Field.Root>
      <button type="submit" className={styles.Button}>
        Launch server
      </button>
      {result ? <output className={styles.Output}>{result}</output> : null}
    </Form>
  );
}

/**
 * The forms handbook react-hook-form pattern, hand-rolled to keep Storybook
 * dependency-free: the library owns state and validation; Base UI `<Form>` stays
 * the element; `Controller`-style state maps onto `Field.Root` (`invalid`/`touched`/
 * `dirty`) and `Field.Error match={Boolean(error)}` renders the library's message.
 */
export const ReactHookFormIntegration: Story = {
  render: () => <ReactHookFormStyleExample />,
  play: async ({ canvas, userEvent }) => {
    const submit = canvas.getByRole('button', { name: 'Launch server' });
    const serverName = canvas.getByLabelText('Server name');

    // The library layer validates on submit and renders through Field.Error...
    await userEvent.click(submit);
    const requiredErrors = await canvas.findAllByText('This field is required.');
    await expect(requiredErrors).toHaveLength(2);

    // ...and focuses the first invalid control via the forwarded ref.
    await expect(serverName).toHaveFocus();

    // Library-owned revalidation on change swaps in the minLength message.
    await userEvent.type(serverName, 'ab');
    await expect(await canvas.findByText('At least 3 characters.')).toBeVisible();

    await userEvent.type(serverName, 'c-01');
    await waitFor(async () => {
      await expect(canvas.queryByText('At least 3 characters.')).not.toBeInTheDocument();
    });

    await userEvent.type(canvas.getByLabelText('Region'), 'eu-central-1');
    await waitFor(async () => {
      await expect(canvas.queryByText('This field is required.')).not.toBeInTheDocument();
    });

    await userEvent.click(submit);
    await expect(await canvas.findByText('Launching abc-01 in eu-central-1')).toBeVisible();
  },
};
