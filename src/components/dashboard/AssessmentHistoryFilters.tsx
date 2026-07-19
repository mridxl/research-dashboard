import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Doctor, TestAdmin } from '@/lib/api/types';

export interface DateRangeFilter {
  from: Date | undefined;
  to: Date | undefined;
}

interface AssessmentHistoryFiltersProps {
  dateRange: DateRangeFilter;
  onDateRangeChange: (range: DateRangeFilter) => void;
  doctorId: string;
  onDoctorIdChange: (id: string) => void;
  testAdminId: string;
  onTestAdminIdChange: (id: string) => void;
  doctorsList: Doctor[];
  testAdminsList: TestAdmin[];
}

export const AssessmentHistoryFilters = ({
  dateRange,
  onDateRangeChange,
  doctorId,
  onDoctorIdChange,
  testAdminId,
  onTestAdminIdChange,
  doctorsList,
  testAdminsList,
}: AssessmentHistoryFiltersProps) => {
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-8 2xl:h-10 min-w-[140px] 2xl:min-w-[180px] justify-start gap-1.5 text-xs 2xl:text-sm font-normal bg-muted/30 border-border/50 hover:bg-muted/50"
          >
            <CalendarIcon className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-muted-foreground shrink-0" />
            {dateRange.from ? (
              dateRange.to ? (
                <span className="truncate">
                  {dateRange.from.toLocaleDateString()} – {dateRange.to.toLocaleDateString()}
                </span>
              ) : (
                <span className="truncate">{dateRange.from.toLocaleDateString()}</span>
              )
            ) : (
              <span className="text-muted-foreground">Filter by date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto" align="start">
          <div className="flex justify-between items-center p-2 border-b">
            <span className="px-2 text-sm font-medium">Select date range</span>
            {(dateRange.from || dateRange.to) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onDateRangeChange({ from: undefined, to: undefined })}
              >
                Clear
              </Button>
            )}
          </div>
          <Calendar
            mode="range"
            defaultMonth={dateRange.from}
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={range =>
              onDateRangeChange({
                from: range?.from,
                to: range?.to,
              })
            }
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
      <Select value={doctorId || 'all'} onValueChange={v => onDoctorIdChange(v === 'all' ? '' : v)}>
        <SelectTrigger className="h-8 2xl:h-10 min-w-[120px] 2xl:min-w-[140px] text-xs 2xl:text-sm bg-muted/30 border-border/50">
          <SelectValue placeholder="Doctor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs 2xl:text-sm">
            All doctors
          </SelectItem>
          {doctorsList.map(d => (
            <SelectItem key={d.id} value={d.id} className="text-xs 2xl:text-sm">
              {d.name || d.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={testAdminId || 'all'}
        onValueChange={v => onTestAdminIdChange(v === 'all' ? '' : v)}
      >
        <SelectTrigger className="h-8 2xl:h-10 min-w-[120px] 2xl:min-w-[140px] text-xs 2xl:text-sm bg-muted/30 border-border/50">
          <SelectValue placeholder="Test Admin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs 2xl:text-sm">
            All test admins
          </SelectItem>
          {testAdminsList.map(a => (
            <SelectItem key={a.id} value={a.id} className="text-xs 2xl:text-sm">
              {a.name || a.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};
