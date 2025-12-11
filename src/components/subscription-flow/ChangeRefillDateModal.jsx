"use client";

import { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";

const ANIMATION_DURATION = 300;

export default function ChangeRefillDateModal({
  isOpen,
  onClose,
  onSave,
  currentRefillDate,
}) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const maxDate = new Date(tomorrow);
  maxDate.setDate(maxDate.getDate() + 90); // 90 days from tomorrow

  const [selectedDate, setSelectedDate] = useState(null);
  const [originalRefillDate, setOriginalRefillDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1)
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Handle mount/unmount animation
  useEffect(() => {
    let visibilityTimeoutId;
    let unmountTimeoutId;

    if (isOpen) {
      setIsMounted(true);
      setIsVisible(false);
      visibilityTimeoutId = setTimeout(() => {
        setIsVisible(true);
      }, 50);
    } else {
      setIsVisible(false);
      unmountTimeoutId = setTimeout(() => {
        setIsMounted(false);
      }, ANIMATION_DURATION);
    }

    return () => {
      if (visibilityTimeoutId) {
        clearTimeout(visibilityTimeoutId);
      }
      if (unmountTimeoutId) {
        clearTimeout(unmountTimeoutId);
      }
    };
  }, [isOpen]);

  // Initialize selected date when modal opens
  useEffect(() => {
    if (isOpen && currentRefillDate) {
      // Parse current refill date (format: "Oct 15, 2025")
      const dateParts = currentRefillDate.split(" ");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthIndex = monthNames.indexOf(dateParts[0]);
      const day = parseInt(dateParts[1].replace(",", ""));
      const year = parseInt(dateParts[2]);
      if (monthIndex !== -1) {
        const parsedDate = new Date(year, monthIndex, day);
        setOriginalRefillDate(parsedDate);
        setSelectedDate(parsedDate);
        setCurrentMonth(new Date(year, monthIndex, 1));
      }
    } else if (isOpen) {
      // Default to tomorrow if no current date
      setOriginalRefillDate(null);
      setSelectedDate(tomorrow);
      setCurrentMonth(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1));
    }
  }, [isOpen, currentRefillDate]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isMounted) return null;

  // Generate months list (from tomorrow to 90 days from tomorrow)
  const generateMonthsList = () => {
    const months = [];
    const startDate = new Date(tomorrow);
    const endDate = new Date(maxDate);

    // Start from the first day of tomorrow's month
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    // Only include months that have at least one selectable date
    while (current <= endDate) {
      const monthEnd = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0
      );
      // Check if this month has any selectable dates
      const monthStartDate = new Date(
        Math.max(current.getTime(), startDate.getTime())
      );
      const monthEndDate = new Date(
        Math.min(monthEnd.getTime(), endDate.getTime())
      );

      if (monthStartDate <= monthEndDate) {
        months.push(new Date(current));
      }

      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return months;
  };

  const monthsList = generateMonthsList();

  // Get days in month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    // Convert to Monday = 0 format
    return (firstDay.getDay() + 6) % 7;
  };

  // Format month/year for display
  const formatMonthYear = (date) => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Check if date is selectable (from tomorrow to 90 days from tomorrow)
  const isDateSelectable = (date) => {
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const tomorrowOnly = new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate()
    );
    const maxDateOnly = new Date(
      maxDate.getFullYear(),
      maxDate.getMonth(),
      maxDate.getDate()
    );
    // Date must be >= tomorrow and <= (tomorrow + 90 days)
    return dateOnly >= tomorrowOnly && dateOnly <= maxDateOnly;
  };

  // Check if date is original refill date (before user changes it)
  const isOriginalRefillDate = (date) => {
    if (!originalRefillDate) return false;
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const originalOnly = new Date(
      originalRefillDate.getFullYear(),
      originalRefillDate.getMonth(),
      originalRefillDate.getDate()
    );
    // Only highlight if it's the original date and different from selected
    return (
      dateOnly.getTime() === originalOnly.getTime() &&
      selectedDate &&
      dateOnly.getTime() !==
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        ).getTime()
    );
  };

  // Check if date is newly selected
  const isNewlySelected = (date) => {
    if (!selectedDate) return false;
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const selectedOnly = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );
    return dateOnly.getTime() === selectedOnly.getTime();
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    if (isDateSelectable(newDate)) {
      setSelectedDate(newDate);
    }
  };

  const handleMonthSelect = (monthDate) => {
    setCurrentMonth(monthDate);
  };

  const handleSave = () => {
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const apiDateFormat = `${year}-${month}-${day}`;
      
      // Also format for display
      const formattedDate = selectedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      onSave(apiDateFormat, formattedDate);
      // Show success modal
      setShowSuccessModal(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onClose();
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  // Success Modal Component
  const SuccessModal = () => {
    const [successVisible, setSuccessVisible] = useState(false);

    useEffect(() => {
      if (showSuccessModal) {
        setTimeout(() => setSuccessVisible(true), 50);
      } else {
        setSuccessVisible(false);
      }
    }, [showSuccessModal]);

    if (!showSuccessModal) return null;

    return (
      <div
        className={`fixed inset-0 z-[10001] flex items-end justify-center pt-[36px] md:items-center md:p-8 transition-opacity duration-300 overflow-hidden ${
          showSuccessModal
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            successVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleSuccessClose}
        />

        {/* Success Modal */}
        <div
          className={`relative bg-white rounded-t-[24px] md:rounded-[24px] w-full max-w-md shadow-xl flex flex-col transform transition-transform duration-300 ease-out ${
            successVisible ? "translate-y-0" : "translate-y-full"
          } md:translate-y-0`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleSuccessClose}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[#F4F4F4] hover:bg-[#F5F4F2] flex items-center justify-center transition-colors cursor-pointer z-10"
          >
            <IoMdClose className="w-5 h-5 text-black" />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Refill Date Updated
              </h2>
            </div>

            {/* Message */}
            <div className="mb-6">
              <p className="text-base text-gray-900">
                Your refill date has been successfully changed. You'll see the
                new date in your plan right away.
              </p>
            </div>

            {/* Done Button */}
            <div className="mt-6">
              <button
                onClick={handleSuccessClose}
                className="w-full px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[10000] flex items-end justify-center pt-[36px] md:items-center md:p-8 transition-opacity duration-300 overflow-hidden ${
          isOpen && !showSuccessModal
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className={`relative bg-white rounded-t-[24px] md:rounded-[24px] w-full md:w-[560px] md:h-[500px] max-h-[95vh] md:max-h-[500px] shadow-xl flex flex-col transform transition-transform duration-300 ease-out ${
            isVisible ? "translate-y-0" : "translate-y-full"
          } md:translate-y-0`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[#F4F4F4] hover:bg-[#F5F4F2] flex items-center justify-center transition-colors cursor-pointer z-10"
          >
            <IoMdClose className="w-5 h-5 text-black" />
          </button>

          {/* Content */}
          <div className="p-6 overflow-y-auto modal-scrollbar md:h-full">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Change Refill Date
              </h2>
              <p className="text-sm text-[#00000099] mt-2">
                Your refill schedule will be changed and saved after
                confirmation.
              </p>
            </div>

            {/* Calendar */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Month/Year Picker - Left Side */}
              <div className="w-full md:w-32 flex-shrink-0">
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {monthsList.map((month, index) => {
                    const isSelected =
                      month.getMonth() === currentMonth.getMonth() &&
                      month.getFullYear() === currentMonth.getFullYear();
                    return (
                      <button
                        key={index}
                        onClick={() => handleMonthSelect(month)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? "bg-gray-200 text-gray-900 font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {formatMonthYear(month)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Calendar Grid - Right Side */}
              <div className="flex-1">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-gray-600 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    if (day === null) {
                      return <div key={index} className="aspect-square" />;
                    }

                    const date = new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth(),
                      day
                    );
                    const selectable = isDateSelectable(date);
                    const isOriginal = isOriginalRefillDate(date);
                    const isNew = isNewlySelected(date);

                    return (
                      <button
                        key={index}
                        onClick={() => handleDateSelect(day)}
                        disabled={!selectable}
                        className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                          isNew
                            ? "bg-black text-white font-medium"
                            : isOriginal
                            ? "bg-gray-200 border-2 border-gray-400 text-gray-900 font-medium"
                            : selectable
                            ? "text-gray-900 hover:bg-gray-100 cursor-pointer"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6">
              <button
                onClick={handleSave}
                disabled={!selectedDate}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                  selectedDate
                    ? "bg-black text-white hover:bg-gray-800 cursor-pointer"
                    : "bg-[#00000033] text-white hover:bg-gray-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Success Modal */}
      <SuccessModal />
    </>
  );
}
