"use client";

import CustomButton from "@/components/utils/Button";

// Helper function to extract filename from URL
const getFilenameFromUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split("/").pop();
    return filename || url;
  } catch {
    // If URL parsing fails, try to extract filename from path
    const parts = url.split("/");
    return parts[parts.length - 1] || url;
  }
};

// Helper function to check if value is a URL
const isUrl = (value) => {
  if (!value || typeof value !== "string") return false;
  return value.startsWith("http://") || value.startsWith("https://");
};

export default function ProfileField({ label, value, onUpdate }) {
  // Check if this is a file upload field (photoId or insuranceCard)
  const isFileField = label === "Photo ID" || label === "Insurance Card";
  
  // Format the display value
  const displayValue = isFileField && isUrl(value) 
    ? getFilenameFromUrl(value) 
    : value;
  
  // Check if we should show as a link (must be a file field, valid URL, and not "NA")
  const showAsLink = isFileField && isUrl(value) && value !== "NA" && displayValue !== "NA";

  return (
    <div className="flex items-center justify-between py-4 px-4 md:px-6 border-b border-gray-200 last:border-b-0">
      <div className="flex-1">
        <p className="text-xs md:text-sm font-medium text-gray-900 mb-1">
          {label}
        </p>
        {showAsLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs md:text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
          >
            {displayValue}
          </a>
        ) : (
          <p className="text-xs md:text-sm text-gray-600">{displayValue}</p>
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
