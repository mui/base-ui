'use client';
import * as React from 'react';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';
import styles from './forms.module.css';

type Target = 'frame' | '_self' | '_blank';

interface LogEntry {
  id: number;
  time: string;
  kind: 'change' | 'submit' | 'formdata' | 'reset' | 'info';
  text: string;
}

/**
 * Tests how PasswordField behaves in a form: hiding on submit and reset, `onRevealedChange`
 * reasons, and what the browser sees when it reads the form (the input's `type` and
 * `autocomplete`).
 *
 * To check autofill history in a real browser, submit while revealed with a field name such as
 * `nickname` (Blink ignores `password`), then type the value's first letter in the history check.
 */
export default function PasswordFieldForms() {
  const id = React.useId();
  const formRef = React.useRef<HTMLFormElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const nextId = React.useRef(0);

  const [name, setName] = React.useState('nickname');
  const [autoComplete, setAutoComplete] = React.useState('current-password');
  const [target, setTarget] = React.useState<Target>('frame');
  const [defaultRevealed, setDefaultRevealed] = React.useState(true);
  const [controlled, setControlled] = React.useState(false);
  const [preventSubmit, setPreventSubmit] = React.useState(false);
  const [cancelSubmitHide, setCancelSubmitHide] = React.useState(false);
  const [cancelResetRestore, setCancelResetRestore] = React.useState(false);
  const [readOnInput, setReadOnInput] = React.useState(false);
  const [revealed, setRevealed] = React.useState(defaultRevealed);
  const [log, setLog] = React.useState<LogEntry[]>([]);
  // Remounts the field when a setting that only applies on mount changes.
  const fieldKey = `${defaultRevealed}-${controlled}`;

  const addLog = React.useCallback((kind: LogEntry['kind'], text: string) => {
    nextId.current += 1;
    const entry = {
      id: nextId.current,
      time: new Date().toLocaleTimeString(undefined, { hour12: false }),
      kind,
      text,
    };
    setLog((entries) => [entry, ...entries].slice(0, 100));
  }, []);

  // What the browser sees when it builds the form data. `formdata` also fires for
  // `new FormData(form)`, which the "read form data while typing" setting exercises.
  React.useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return undefined;
    }
    function handleFormData(event: FormDataEvent) {
      const input = inputRef.current;
      const entries = Array.from(event.formData.entries())
        .map(([key, value]) => `${key}=${String(value)}`)
        .join(', ');
      addLog(
        'formdata',
        `input type="${input?.type}" autocomplete="${input?.autocomplete}"; ` +
          `sent: ${entries || 'nothing'}`,
      );
    }
    form.addEventListener('formdata', handleFormData);
    return () => form.removeEventListener('formdata', handleFormData);
  }, [addLog]);

  const handleRevealedChange = (
    nextRevealed: boolean,
    eventDetails: PasswordField.Root.ChangeEventDetails,
  ) => {
    const cancel =
      (eventDetails.reason === 'form-submit' && cancelSubmitHide) ||
      (eventDetails.reason === 'form-reset' && cancelResetRestore);
    if (cancel) {
      eventDetails.cancel();
    }
    addLog(
      'change',
      `onRevealedChange(${nextRevealed}, '${eventDetails.reason}')${cancel ? ' — canceled' : ''}`,
    );
    if (controlled && !cancel) {
      setRevealed(nextRevealed);
    }
  };

  const rootProps = controlled
    ? { revealed, onRevealedChange: handleRevealedChange }
    : { defaultRevealed, onRevealedChange: handleRevealedChange };

  return (
    <div className={styles.Page}>
      <div className={styles.Columns}>
        <div className={styles.Column}>
          <section className={styles.Section}>
            <h2 className={styles.SectionTitle}>Settings</h2>
            <label className={styles.TextSetting}>
              Input name
              <input
                className={styles.TextInput}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className={styles.TextSetting}>
              autoComplete
              <select
                className={styles.TextInput}
                value={autoComplete}
                onChange={(event) => setAutoComplete(event.target.value)}
              >
                <option value="current-password">current-password</option>
                <option value="new-password">new-password</option>
                <option value="on">on</option>
              </select>
            </label>
            <label className={styles.TextSetting}>
              Submit target
              <select
                className={styles.TextInput}
                value={target}
                onChange={(event) => setTarget(event.target.value as Target)}
              >
                <option value="frame">Hidden frame (keeps the log)</option>
                <option value="_self">This tab (for the save-password offer)</option>
                <option value="_blank">New tab</option>
              </select>
            </label>
            <Checkbox
              checked={defaultRevealed}
              onChange={(next) => {
                setDefaultRevealed(next);
                setRevealed(next);
              }}
            >
              Start revealed (remounts)
            </Checkbox>
            <Checkbox
              checked={controlled}
              onChange={(next) => {
                setControlled(next);
                setRevealed(defaultRevealed);
              }}
            >
              Control <code>revealed</code> (remounts)
            </Checkbox>
            <Checkbox checked={preventSubmit} onChange={setPreventSubmit}>
              <code>preventDefault()</code> in <code>onSubmit</code>
            </Checkbox>
            <Checkbox checked={cancelSubmitHide} onChange={setCancelSubmitHide}>
              Cancel <code>&apos;form-submit&apos;</code>
            </Checkbox>
            <Checkbox checked={cancelResetRestore} onChange={setCancelResetRestore}>
              Cancel <code>&apos;form-reset&apos;</code>
            </Checkbox>
            <Checkbox checked={readOnInput} onChange={setReadOnInput}>
              Read <code>new FormData(form)</code> while typing
            </Checkbox>
          </section>

          <section className={styles.Section}>
            <h2 className={styles.SectionTitle}>Sign in</h2>
            <form
              ref={formRef}
              className={styles.Form}
              method="post"
              // Posts to this page: WebKit treats a form posting to `about:blank` as insecure.
              action=""
              target={target === 'frame' ? `${id}-frame` : target}
              onSubmit={(event) => {
                addLog('submit', `submit${preventSubmit ? ' — prevented by onSubmit' : ''}`);
                if (preventSubmit) {
                  event.preventDefault();
                }
              }}
              onReset={() => addLog('reset', 'reset')}
            >
              <label className={styles.TextSetting}>
                Username
                <input className={styles.TextInput} name="username" autoComplete="username" />
              </label>
              <PasswordField.Root key={fieldKey} id={`${id}-password`} {...rootProps}>
                <label className={styles.TextSetting} htmlFor={`${id}-password`}>
                  Password
                </label>
                <PasswordField.Group className={styles.Group}>
                  <PasswordField.Input
                    ref={inputRef}
                    className={styles.Input}
                    name={name || undefined}
                    autoComplete={autoComplete}
                    onChange={() => {
                      if (readOnInput && formRef.current) {
                        // eslint-disable-next-line no-new
                        new FormData(formRef.current);
                      }
                    }}
                  />
                  <PasswordField.Toggle className={styles.Toggle} aria-label="Show password">
                    <PasswordField.ToggleIndicator match="off">Show</PasswordField.ToggleIndicator>
                    <PasswordField.ToggleIndicator match="on">Hide</PasswordField.ToggleIndicator>
                  </PasswordField.Toggle>
                </PasswordField.Group>
              </PasswordField.Root>
              <div className={styles.Buttons}>
                <button className={styles.Button} type="submit">
                  Submit button
                </button>
                <button
                  className={styles.Button}
                  type="button"
                  onClick={() => formRef.current?.requestSubmit()}
                >
                  requestSubmit()
                </button>
                <button
                  className={styles.Button}
                  type="button"
                  onClick={() => {
                    addLog('info', 'form.submit() — fires no submit event');
                    formRef.current?.submit();
                  }}
                >
                  form.submit()
                </button>
                {/* eslint-disable-next-line react/button-has-type */}
                <button className={styles.Button} type="reset">
                  Reset button
                </button>
                <button
                  className={styles.Button}
                  type="button"
                  onClick={() => formRef.current && new FormData(formRef.current)}
                >
                  new FormData(form)
                </button>
              </div>
            </form>
            {target === 'frame' && <iframe hidden name={`${id}-frame`} title="Submission target" />}
          </section>

          <section className={styles.Section}>
            <h2 className={styles.SectionTitle}>Autofill history check</h2>
            <p className={styles.Description}>
              A plain text field named <code>{name || '(no name)'}</code> in its own form. Type the
              first letter of a submitted password: if the browser suggests it, the password was
              saved to autofill history.
            </p>
            <form className={styles.Form} onSubmit={(event) => event.preventDefault()}>
              <input
                className={styles.TextInput}
                name={name || undefined}
                aria-label="Autofill history check"
              />
            </form>
          </section>
        </div>

        <section className={`${styles.Section} ${styles.LogSection}`}>
          <div className={styles.LogHeader}>
            <h2 className={styles.SectionTitle}>Log</h2>
            <button className={styles.Button} type="button" onClick={() => setLog([])}>
              Clear
            </button>
          </div>
          <ol className={styles.Log} aria-live="polite">
            {log.length === 0 && <li className={styles.LogEmpty}>No events yet.</li>}
            {log.map((entry) => (
              <li key={entry.id} className={styles.LogEntry} data-kind={entry.kind}>
                <span className={styles.LogTime}>{entry.time}</span>
                <span className={styles.LogKind}>{entry.kind}</span>
                <span>{entry.text}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

function Checkbox(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.Checkbox}>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(event) => props.onChange(event.target.checked)}
      />
      <span>{props.children}</span>
    </label>
  );
}
