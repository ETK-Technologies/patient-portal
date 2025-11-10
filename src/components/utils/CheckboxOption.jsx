import React from "react";

export default function CheckboxOption({
  label,
  description,
  checked = false,
  onClick,
  color = "#AE7E56",
  className = "",
  buttonProps = {},
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-[8px] border p-4 min-h-[52px] flex items-start justify-between transition-colors ${
        checked ? "border-[1.5px]" : "border"
      } bg-transparent ${className}`}
      style={{ borderColor: checked ? color : "#E2E2E1" }}
      {...buttonProps}
    >
      <div>
        <div className="text-[14px] font-medium text-[black] leading-[140%]">
          {label}
        </div>
        {description ? (
          <div className="text-[14px] font-normal text-[#5E5E5E] leading-[140%]">
            {description}
          </div>
        ) : null}
      </div>
      {/* Checkbox visual */}
      <span
        role="checkbox"
        aria-checked={checked}
        aria-label={checked ? "Checked" : "Unchecked"}
        className={`inline-flex items-center justify-center ml-3 mt-1 ${
          checked ? "border" : "invisible border"
        } w-5 h-5 rounded-[4px]`}
        style={{
          borderColor: color,
          backgroundColor: checked ? color : undefined,
        }}
      >
        {checked ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="#FFFFFF"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
    </button>
  );
}
