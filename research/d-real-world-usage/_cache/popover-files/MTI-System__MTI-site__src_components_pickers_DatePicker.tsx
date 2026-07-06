import { Popover } from "@base-ui-components/react/popover"
import { CSSProperties, useEffect, useState } from "react"
import { DateRange, DayPicker, DayPickerProps } from "react-day-picker"
import { FaEdit } from "react-icons/fa"

interface DatePickerBaseProps {
  defaultDate?: Date | DateRange
  className?: string
  captionLayout?: "dropdown" | "label" | "dropdown-months" | "dropdown-years" | undefined
  startMonth?: Date
  endMonth?: Date
}

interface SingleDatePicker {
  type: "single"
  onPick: (data: Date) => void
}

interface RangeDatePicker {
  type: "range"
  onPick: (data: DateRange) => void
}

export type DatePickerProps = DatePickerBaseProps & (SingleDatePicker | RangeDatePicker)

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

export default function DatePicker({
  onPick,
  type,
  defaultDate,
  className,
  startMonth,
  endMonth,
  captionLayout = "label",
}: DatePickerProps) {
  console.log(defaultDate)
  const [selected, setSelected] = useState<any>(defaultDate)
  const [isPopoverOpened, setIsPopoverOpened] = useState(false)

  useEffect(() => {
    console.log(selected)
  }, [selected])

  return (
    <Popover.Root
      open={isPopoverOpened}
      onOpenChange={(e) => {
        setIsPopoverOpened(e)
        if (!e) {
          if (!selected) return
          onPick(selected)
        }
      }}
    >
      <Popover.Trigger
        className={className ?? "hover:text-accent-primary flex cursor-pointer items-center gap-2 transition-colors"}
      >
        <span className="text-[0.8rem]">
          {selected ? (
            type === "range" ? (
              `${formatDate(selected?.from)}-${formatDate(selected?.to)}`
            ) : (
              formatDate(selected)
            )
          ) : (
            <p>Выберите дату</p>
          )}
        </span>
        <FaEdit />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="relative z-2" sideOffset={8} align={"start"}>
          <Popover.Popup className="text-text-main border-border origin-(--transform-origin) rounded-lg border bg-[canvas] px-6 py-4 shadow-lg shadow-gray-200 transition-[transform,scale,opacity] data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0 dark:shadow-none">
            <DayPicker
              mode={type}
              onSelect={setSelected as any}
              selected={selected}
              required={true}
              animate
              fixedWeeks={true}
              captionLayout={captionLayout}
              startMonth={startMonth}
              endMonth={endMonth}
              style={
                {
                  "--rdp-accent-color": "var(--color-accent-primary)",
                  "--rdp-accent-background-color": "rgba(from var(--color-accent-primary) r g b / 0.3)",
                } as CSSProperties
              }
            />
            <button
              onClick={() => {
                if (!selected) return
                onPick(selected)
                setIsPopoverOpened(false)
              }}
              className="bg-accent-primary/25 hover:bg-accent-primary/50 text-accent-primary border-accent-primary mt-4 w-full rounded-2xl border-3 p-2"
            >
              Применить
            </button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
