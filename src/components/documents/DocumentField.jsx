"use client";

import { useState, useRef, useEffect } from "react";
import { HiOutlineDotsVertical, HiInformationCircle } from "react-icons/hi";

export default function DocumentField({ label, value, document }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      window.document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleViewClick = () => {
    if (document?.document_path) {
      window.open(document.document_path, "_blank");
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-4 px-4 md:px-6 border-b border-gray-200 last:border-b-0">
      <div className="flex-1">
        <p className="text-xs md:text-sm font-medium text-gray-900 mb-1">
          {label}
        </p>
        {value && (
          <p className="text-xs md:text-sm text-gray-600">{value}</p>
        )}
      </div>
      {/* Desktop: vertical dots, Mobile: info icon */}
      <div className="ml-4 relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="md:hidden text-gray-400 hover:text-gray-600 p-2 rounded-full border border-gray-300 hover:border-gray-400"
        >
          <HiInformationCircle className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="hidden md:block text-gray-400 hover:text-gray-600 p-2 rounded-full border border-gray-300 hover:border-gray-400"
        >
          <HiOutlineDotsVertical className="w-5 h-5" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 bottom-full mb-2 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-[9999]">
            <button
              onClick={handleViewClick}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              View
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
