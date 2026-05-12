import { useState } from "react";

interface CalendarProps {
  selectedDates?: Date[];
  onDateSelect?: (date: Date) => void;
  onDateRemove?: (date: Date) => void;
  disabled?: boolean;
}

export default function Calendar({
  selectedDates = [],
  onDateSelect,
  onDateRemove,
  disabled = false,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const isDateSelected = (day: number) => {
    if (!day) return false;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    return selectedDates.some(
      (selectedDate) => selectedDate.toDateString() === date.toDateString(),
    );
  };

  const isDatePast = (day: number) => {
    if (!day) return false;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  };

  const handleDateClick = (day: number) => {
    if (!day || disabled || isDatePast(day)) return;

    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );

    if (isDateSelected(day) && onDateRemove) {
      onDateRemove(date);
    } else if (!isDateSelected(day) && onDateSelect) {
      onDateSelect(date);
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction: number) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction),
    );
  };

  return (
    <div className="bg-white p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          disabled={disabled}
          className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          ←
        </button>
        <h3 className="font-semibold text-lg">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          disabled={disabled}
          className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {generateCalendarDays().map((day, index) => (
          <div
            key={index}
            onClick={() => handleDateClick(day || 0)}
            className={`
              aspect-square flex items-center justify-center text-sm cursor-pointer
              ${!day ? "invisible" : ""}
              ${isDatePast(day || 0) ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100"}
              ${isDateSelected(day || 0) ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
              ${disabled ? "cursor-not-allowed opacity-50" : ""}
            `}
          >
            {day}
          </div>
        ))}
      </div>

      {selectedDates.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium mb-2">Selected Dates:</p>
          <div className="flex flex-wrap gap-1">
            {selectedDates.map((date, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
              >
                {date.toLocaleDateString()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
