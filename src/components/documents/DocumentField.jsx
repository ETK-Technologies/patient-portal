"use client";

import { HiOutlineDotsVertical, HiInformationCircle } from "react-icons/hi";

export default function DocumentField({ label, value }) {
  return (
    <div className="flex items-center justify-between py-4 px-4 md:px-6 border-b border-gray-200 last:border-b-0">
      <div className="flex-1">
        <p className="text-xs md:text-sm font-medium text-gray-900 mb-1">
          {label}
        </p>
        <p className="text-xs md:text-sm text-gray-600">{value}</p>
      </div>
      {/* Desktop: vertical dots, Mobile: info icon */}
      <div className="ml-4">
        <button className="md:hidden text-gray-400 hover:text-gray-600">
          <HiInformationCircle className="w-5 h-5" />
        </button>
        <button className="hidden md:block text-gray-400 hover:text-gray-600">
          <HiOutlineDotsVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
