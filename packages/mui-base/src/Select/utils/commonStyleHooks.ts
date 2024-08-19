export const commonStyleHooks = {
  open: (value: boolean) => ({
    'data-select': value ? 'open' : 'closed',
  }),
} as const;
