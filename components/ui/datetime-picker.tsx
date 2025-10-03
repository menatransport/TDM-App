"use client";

import * as React from "react";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import * as Select from "@radix-ui/react-select";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "เลือกวันที่และเวลา",
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState("");
  const [viewDate, setViewDate] = React.useState(new Date());

  // Parse existing value
  React.useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setViewDate(date);
        // Format time as HH:MM (24-hour format)
        const timeStr = date.toTimeString().slice(0, 5);
        setSelectedTime(timeStr);
      }
    }
  }, [value]);

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(newDate);
    
    if (selectedTime) {
      const combined = `${newDate.toISOString().split('T')[0]}T${selectedTime}`;
      onChange?.(combined);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setSelectedTime(newTime);
    if (selectedDate && newTime) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const combined = `${dateStr}T${newTime}`;
      onChange?.(combined);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Get days from previous month
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    const days = [];
    
    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      });
    }
    
    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isToday = currentDate.toDateString() === today.toDateString();
      const isSelected = selectedDate ? currentDate.toDateString() === selectedDate.toDateString() : false;
      
      days.push({
        day,
        isCurrentMonth: true,
        isToday,
        isSelected
      });
    }
    
    // Next month days to fill the grid
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      });
    }
    
    return days;
  };

  // Format display value
  const formatDisplayValue = () => {
    if (!selectedDate || !selectedTime) return placeholder;
    
    const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
    const monthNames = [
      "ม.ค", "ก.พ", "มี.ค", "เม.ย", "พ.ค", "มิ.ย",
      "ก.ค", "ส.ค", "ก.ย", "ต.ค", "พ.ย", "ธ.ค"
    ];
    
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const month = monthNames[selectedDate.getMonth()];
    const year = selectedDate.getFullYear();
    const dayName = dayNames[selectedDate.getDay()];
    
    return `${dayName} ${day} ${month} ${year}, ${selectedTime}`;
  };

  // Generate time options (24-hour format)
  const timeOptions = React.useMemo(() => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeStr);
      }
    }
    return options;
  }, []);

  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const dayHeaders = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
            disabled && "cursor-not-allowed opacity-50 bg-gray-50",
            !selectedDate && !selectedTime && "text-gray-400",
            className
          )}
        >
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            {formatDisplayValue()}
          </span>
          <Clock className="h-4 w-4 text-gray-400" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-96 rounded-lg border border-gray-200 bg-white p-4 shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="text-sm font-semibold text-gray-900">
                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
              </h3>
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-1">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1">
                {dayHeaders.map((day) => (
                  <div
                    key={day}
                    className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(day.day)}
                    className={cn(
                      "h-8 w-8 text-xs rounded-md transition-colors flex items-center justify-center",
                      day.isCurrentMonth
                        ? "text-gray-900 hover:bg-blue-50"
                        : "text-gray-300 cursor-not-allowed",
                      day.isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                      day.isToday && !day.isSelected && "bg-blue-100 text-blue-900 font-medium"
                    )}
                  >
                    {day.day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Select */}
            <div className="space-y-2">
              {/* <label className="text-sm font-medium text-gray-700">เวลา</label> */}
              <Select.Root
                value={selectedTime}
                onValueChange={handleTimeChange}
              >
                <Select.Trigger className="flex w-full items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <Select.Value placeholder="เลือกเวลา" />
                  <Select.Icon>
                    <Clock className="h-4 w-4 text-gray-400" />
                  </Select.Icon>
                </Select.Trigger>

                <Select.Portal>
                  <Select.Content className="z-50 max-h-60 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg animate-in fade-in-0 zoom-in-95">
                    <Select.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-white text-gray-900">
                      <div className="h-3 w-3 rotate-180 transform">▼</div>
                    </Select.ScrollUpButton>
                    <Select.Viewport className="p-1">
                      {timeOptions.map((time) => (
                        <Select.Item
                          key={time}
                          value={time}
                          className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-blue-50 focus:bg-blue-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        >
                          <Select.ItemText>{time}</Select.ItemText>
                          <Select.ItemIndicator className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-blue-600" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-white text-gray-900">
                      <div className="h-3 w-3">▼</div>
                    </Select.ScrollDownButton>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedTime("");
                  onChange?.("");
                }}
                className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              >
                ล้าง
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition-colors"
              >
                ตกลง
              </button>
            </div>
          </div>

          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}