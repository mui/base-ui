# mergeProps — story plan

Utils tier: 1 story — the merge contract is behavior, and the two things prose explains badly (execution order, cancellation) are exactly what a live log shows well.

1. **`HandlerOrderAndCancellation`** — a `Toggle` (mirroring the docs `prevent-base-ui-handler` demo) rendered via the function form: `render={(props) => <button {...mergeProps(props, { onClick })} />}`. Two visible affordances:
   - an on-screen **event log** listing handler firing order ("user onClick" → "Base UI internal toggled"), proving rightmost-runs-first;
   - a **Lock checkbox**: when locked, the user handler calls `event.preventBaseUIHandler()` and the log shows the internal toggle never fires (pressed state frozen) — without `preventDefault`/`stopPropagation` side effects.
   Play function: click while unlocked → assert both log lines + `data-pressed` flips; lock → click → assert only the user line appears and `data-pressed` is unchanged.
   Serves Definition-of-Done sections: behavior (merge contract), prop guidance (argument order), pitfalls (order confusion, cancellation scope).

MDX-only coverage (no story needed): className `'b a'` ordering, style merge, ref-not-merged, getter-form manual chaining, `mergePropsN` — pure-value semantics better shown as code snippets with inline results.
