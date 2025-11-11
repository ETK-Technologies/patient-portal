"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { RiAccountCircleLine } from "react-icons/ri";

export default function AccountDropdown({ onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 hover:text-gray-800 hover:bg-[#F1F0EF] cursor-pointer rounded-lg transition-colors"
      >
        <RiAccountCircleLine className="w-4 h-4" />

        <span className="text-sm font-medium">Account</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div
        className={`absolute top-full left-0 lg:left-auto lg:right-0 mt-2 w-56 rounded-lg border border-gray-200 py-2 z-50 transition-all duration-200 ease-out origin-top ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
        }`}
        style={{
          backgroundColor: "#FFFFFF",
          boxShadow: "0px 0px 16px 0px #00000014",
        }}
      >
        {/* Profile - Primary item */}
        <Link
          href="/profile"
          className="block px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          onClick={() => {
            setIsOpen(false);
            onSelect?.();
          }}
        >
          Profile
        </Link>

        {/* Medical History */}
        <Link
          href="/medical-history"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => {
            setIsOpen(false);
            onSelect?.();
          }}
        >
          Medical History
        </Link>

        {/* Billing and shipping */}
        <Link
          href="/billing-shipping"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => {
            setIsOpen(false);
            onSelect?.();
          }}
        >
          Billing and shipping
        </Link>

        {/* Documents */}
        <Link
          href="/documents"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => {
            setIsOpen(false);
            onSelect?.();
          }}
        >
          Documents
        </Link>

        {/* First separator */}
        <hr className="my-2 border-gray-200" />

        {/* Contact us */}
        <Link
          href="/contact"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => {
            setIsOpen(false);
            onSelect?.();
          }}
        >
          Contact us
        </Link>

        {/* Second separator */}
        <hr className="my-2 border-gray-200" />

        {/* Log out */}
        <button
          onClick={() => {
            setIsOpen(false);
            onSelect?.();
            // Add logout logic here
          }}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
