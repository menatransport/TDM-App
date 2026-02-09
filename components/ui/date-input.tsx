"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateInputProps {
  value?: string; // yyyy-mm-dd format
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Format date from yyyy-mm-dd to dd/mm/yyyy
const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
};

// Parse date from dd/mm/yyyy to yyyy-mm-dd
const parseInputDate = (displayStr: string): string => {
  if (!displayStr) return "";
  const [day, month, year] = displayStr.split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

// Validate date string in dd/mm/yyyy format
const isValidDisplayDate = (str: string): boolean => {
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = str.match(regex);
  if (!match) return false;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
};

export function DateInput({
  value = "",
  onChange,
  placeholder = "dd/mm/yyyy",
  disabled = false,
  className,
}: DateInputProps) {
  const [displayValue, setDisplayValue] = React.useState(() => formatDisplayDate(value));
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hiddenInputRef = React.useRef<HTMLInputElement>(null);

  // Sync display value when external value changes
  React.useEffect(() => {
    setDisplayValue(formatDisplayDate(value));
  }, [value]);

  const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    // Auto-format: add slashes while typing
    const digits = input.replace(/\D/g, "");
    let formatted = "";
    
    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
    
    setDisplayValue(formatted);
    
    // Only update parent if valid complete date
    if (isValidDisplayDate(formatted)) {
      const isoDate = parseInputDate(formatted);
      onChange?.(isoDate);
    }
  };

  const handleBlur = () => {
    // On blur, validate and format properly
    if (displayValue && !isValidDisplayDate(displayValue)) {
      // Reset to last valid value
      setDisplayValue(formatDisplayDate(value));
    }
  };

  const handleCalendarClick = () => {
    hiddenInputRef.current?.showPicker?.();
  };

  const handleHiddenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(formatDisplayDate(newValue));
    onChange?.(newValue);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleDisplayChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors",
          disabled && "bg-gray-100 cursor-not-allowed",
          className
        )}
      />
      <button
        type="button"
        onClick={handleCalendarClick}
        disabled={disabled}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Calendar size={18} />
      </button>
      {/* Hidden native date input for calendar picker */}
      <input
        ref={hiddenInputRef}
        type="date"
        value={value}
        onChange={handleHiddenChange}
        disabled={disabled}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}
