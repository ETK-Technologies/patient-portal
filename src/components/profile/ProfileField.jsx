"use client";

import CustomButton from "@/components/utils/Button";

export default function ProfileField({ label, value, onUpdate }) {
  // Handle empty values
  const displayValue = value || "Not provided";

  // Check if value is an image URL (for photo ID and insurance card)
  const isImageUrl =
    (label === "Photo ID" || label === "Insurance Card") &&
    value &&
    (value.startsWith("http://") || value.startsWith("https://"));

  return (
    <div className="flex items-center justify-between py-4 px-4 md:px-6 border-b border-gray-200 last:border-b-0">
      <div className="flex-1">
        <p className="text-xs md:text-sm font-medium text-gray-900 mb-1">
          {label}
        </p>
        {isImageUrl ? (
          <div className="flex items-center gap-2">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs md:text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              View Image
            </a>
            <span className="text-xs text-gray-400">({value.substring(0, 50)}...)</span>
          </div>
        ) : (
          <p className={`text-xs md:text-sm ${!value ? "text-gray-400 italic" : "text-gray-600"}`}>
            {displayValue}
          </p>
        )}
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
