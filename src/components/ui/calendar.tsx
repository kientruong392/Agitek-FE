"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

type CalendarProps = {
  value?: Date;
  onChange: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function Calendar({ value, onChange, disabled, className }: CalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => value ?? new Date());
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const days = useMemo(() => {
    const offset = monthStart.getDay();
    const count = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [monthStart.getDay(), visibleMonth.getFullYear(), visibleMonth.getMonth()]);
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(visibleMonth);

  return (
    <div className={cn("w-64 rounded-2xl bg-popover p-3 text-popover-foreground", className)}>
      <div className="mb-2 flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}><ChevronLeft /></Button>
        <span className="text-sm font-medium">{monthLabel}</span>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}><ChevronRight /></Button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((day) => <span key={day} className="py-2">{day}</span>)}
        {days.map((day, index) => {
          if (day == null) return <span key={`blank-${index}`} />;
          const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
          const isSelected = value?.toDateString() === date.toDateString();
          const isDisabled = disabled?.(date) ?? false;
          return (
            <Button
              key={day}
              type="button"
              variant={isSelected ? "default" : "ghost"}
              size="icon-sm"
              className="mx-auto"
              disabled={isDisabled}
              aria-pressed={isSelected}
              onClick={() => onChange(date)}
            >
              {day}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
