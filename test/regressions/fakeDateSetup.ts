// Override Date so that `new Date()` and `Date.now()` return a stable timestamp for Argos.
// This must be imported before any other module that uses Date.
//
// We can't use a `class extends Date` to patch it, because @date-fns/tz's TZDateMini relies on
// `Object.getOwnPropertyNames(Date.prototype)` returning all native methods (get*, set*) to set up
// its timezone-aware overrides. A subclass's prototype only has 'constructor' as an own property.
// Using Reflect.construct preserves the native Date.prototype while correctly forwarding new.target
// for proper subclass construction (TZDateMini extends Date).

// Calendar PR merge day
const fakeNow = new Date('2026-03-13T17:44:00Z').valueOf();

const OriginalDate = Date;
const offset = fakeNow - OriginalDate.now();

function FakeDate(...args: any[]): Date | string {
  if (new.target) {
    return args.length === 0
      ? Reflect.construct(OriginalDate, [OriginalDate.now() + offset], new.target)
      : Reflect.construct(OriginalDate, args, new.target);
  }
  return new OriginalDate(OriginalDate.now() + offset).toString();
}

FakeDate.prototype = OriginalDate.prototype;
FakeDate.parse = OriginalDate.parse;
FakeDate.UTC = OriginalDate.UTC;
FakeDate.now = () => OriginalDate.now() + offset;

(globalThis as any).Date = FakeDate;
