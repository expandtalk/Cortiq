import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { sv } from 'date-fns/locale';

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({ dateRange, onDateRangeChange, className }: DateRangePickerProps) {
  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className="w-[300px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd MMM y", { locale: sv })} -{" "}
                  {format(dateRange.to, "dd MMM y", { locale: sv })}
                </>
              ) : (
                format(dateRange.from, "dd MMM y", { locale: sv })
              )
            ) : (
              <span>Välj datumintervall</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
            locale={sv}
          />
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  onDateRangeChange({ from: sevenDaysAgo, to: today });
                }}
              >
                Senaste 7 dagarna
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  onDateRangeChange({ from: thirtyDaysAgo, to: today });
                }}
              >
                Senaste 30 dagarna
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                  onDateRangeChange({ from: ninetyDaysAgo, to: today });
                }}
              >
                Senaste 90 dagarna
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}