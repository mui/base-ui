import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import Stack from '@mui/system/Stack';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import { Select, SelectRootSlotProps } from '@mui/base/Select';
import { Option } from '@mui/base/Option';
import { FormField, HelpText, Label } from '@mui/base';

const SelectButton = React.forwardRef(function SelectButton<
  TValue extends {},
  Multiple extends boolean,
>(props: SelectRootSlotProps<TValue, Multiple>, ref: React.ForwardedRef<HTMLButtonElement>) {
  const { ownerState, ...other } = props;
  return (
    <button type="button" {...other} ref={ref}>
      {other.children}
      <UnfoldMoreRoundedIcon />
    </button>
  );
});

export default function FormFieldExamples() {
  const [value, setValue] = React.useState<1 | 2 | 3>(1);

  const { control, handleSubmit } = useForm({
    defaultValues: {
      replies: 'anyone', // 'anyone' | 'friends' | 'you'
    },
  });

  const submitRhfForm = (data) => console.log('submit', data);

  return (
    <Stack className="m-6" spacing={6}>
      <FormField className="flex flex-col" id="my-form-field">
        <Label className="font-sans font-medium text-sm">Shipping Country</Label>
        <HelpText className="font-sans text-sm mb-2">
          We cannot ship cards to unsupported countries
        </HelpText>
        <Select
          id="my-select"
          className="GallerySelect"
          slots={{
            root: SelectButton,
          }}
          slotProps={{
            listbox: { className: 'GallerySelect-listbox' },
            popup: { className: 'GallerySelect-popup' },
          }}
          defaultValue="AU"
        >
          <Option className="GallerySelect-option" value="AU">
            Australia
          </Option>
          <Option className="GallerySelect-option" value="BE">
            Belgium
          </Option>
          <Option className="GallerySelect-option" value="CA">
            Canada
          </Option>
        </Select>
      </FormField>

      <FormField className="flex flex-col w-[300px]">
        <Label className="font-sans font-medium text-sm">Pronoun</Label>
        <HelpText className="font-sans text-sm mb-2">
          Example use: Albert Yu added Meg 2: The Trench to{' '}
          {
            {
              1: 'their',
              2: 'his',
              3: 'her',
            }[value]
          }{' '}
          watchlist
        </HelpText>
        <Select
          className="GallerySelect"
          slots={{
            root: SelectButton,
          }}
          slotProps={{
            listbox: { className: 'GallerySelect-listbox' },
            popup: { className: 'GallerySelect-popup' },
          }}
          value={value}
          onChange={(ev, newValue) => newValue && setValue(newValue)}
        >
          <Option className="GallerySelect-option" value={1}>
            They/their
          </Option>
          <Option className="GallerySelect-option" value={2}>
            He/his
          </Option>
          <Option className="GallerySelect-option" value={3}>
            She/her
          </Option>
        </Select>
      </FormField>

      <form onSubmit={handleSubmit(submitRhfForm)}>
        <Controller
          name="replies"
          control={control}
          render={({ field, fieldState }) => {
            const {
              onChange,
              // onBlur, // TODO: onBlur callback?
              value: rhfValue,
              disabled,
              name,
              // ref, // we can't use this
            } = field;

            const {
              invalid,
              isTouched,
              isDirty,
              // error, // we can't use this yet
            } = fieldState;

            return (
              <FormField
                name={name}
                disabled={disabled}
                invalid={invalid}
                touched={isTouched}
                dirty={isDirty}
                className="flex flex-col w-[300px]"
              >
                <Label className="font-sans font-medium text-sm">Replies</Label>
                <HelpText className="font-sans text-xs mb-2">
                  This default can be overridden on individual reviews
                </HelpText>
                <Select
                  className="GallerySelect"
                  slots={{
                    root: SelectButton,
                  }}
                  slotProps={{
                    listbox: { className: 'GallerySelect-listbox' },
                    popup: { className: 'GallerySelect-popup' },
                  }}
                  value={rhfValue}
                  onChange={(ev, newValue) => onChange(newValue)}
                >
                  <Option className="GallerySelect-option" value="anyone">
                    Anyone
                  </Option>
                  <Option className="GallerySelect-option" value="friends">
                    Friends
                  </Option>
                  <Option className="GallerySelect-option" value="you">
                    Only you
                  </Option>
                </Select>
              </FormField>
            );
          }}
        />
      </form>
    </Stack>
  );
}
