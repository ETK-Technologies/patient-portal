"use client";

import CustomButton from "@/components/utils/Button";

export default function ProfileField({ label, value, onUpdate }) {
  return (
    <div className="flex items-center justify-between py-4 px-4 md:px-6 border-b border-gray-200 last:border-b-0">
      <div className="flex-1">
        <p className="text-xs md:text-sm font-medium text-gray-900 mb-1">
          {label}
        </p>
        <p className="text-xs md:text-sm text-gray-600">{value}</p>
      </div>
      <div className="ml-4">
        <CustomButton
          text="Update"
          onClick={onUpdate}
          variant="secondary"
          size="small"
          width="auto"
        />
      </div>
    </div>
  );
}
