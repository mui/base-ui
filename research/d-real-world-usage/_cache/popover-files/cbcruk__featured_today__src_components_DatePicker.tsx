'use client'

import {
  DayButtonProps,
  DayPicker,
  type PropsBase,
  type PropsSingle,
} from 'react-day-picker'
import { Popover } from '@base-ui-components/react/popover'
import { ko } from 'react-day-picker/locale'
import { FIRST_DATE, LAST_DATE } from '@/constants'
import Link from 'next/link'
import { getDisplayFormat } from '@/lib/date'

type Props = PropsBase & PropsSingle

function DayButton({ day, className, disabled }: DayButtonProps) {
  const formattedDate = getDisplayFormat('YYYY-MM-DD', day.date)

  return (
    <Link
      prefetch
      href={`/featured/${formattedDate}`}
      className={className}
      data-disabled={disabled}
    >
      {day.date.getDate()}
    </Link>
  )
}

export function DatePicker(props: Props) {
  return (
    <>
      <Popover.Root>
        <Popover.Trigger>🗓️</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup>
              <DayPicker
                locale={ko}
                showOutsideDays
                disabled={{
                  before: new Date(FIRST_DATE),
                  after: new Date(LAST_DATE),
                }}
                classNames={{
                  root: 'shadow-lg p-4 bg-gray-800 rounded-xl text-sm',
                  month_caption: 'text-center font-bold',
                  selected: `bg-blue-500`,
                  nav: 'absolute left-0 px-4 flex justify-between w-full',
                  chevron: `w-4 fill-blue-500`,
                  weekday: 'font-bold py-4 text-xs text-center',
                  day: 'p-1 text-center rounded-full overflow-hidden data-[disabled=true]:pointer-events-none',
                  day_button: 'inline-flex justify-center w-[24px] h-[24px]',
                  outside: 'opacity-50',
                  disabled: 'opacity-10',
                }}
                components={{
                  DayButton,
                }}
                {...props}
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </>
  )
}
