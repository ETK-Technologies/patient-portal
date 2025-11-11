import React from "react";

export default function RadioOption({
  label,
  description,
  selected = false,
  onClick,
  color = "#AE7E56",
  className = "",
  buttonProps = {},
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-[8px] border p-4 flex ${
        description ? "items-start" : "items-center"
      } justify-between transition-colors cursor-pointer ${
        selected ? "border-[1.5px]" : "border"
      } bg-transparent ${className}`}
      style={{ borderColor: selected ? color : "#E2E2E1" }}
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
      {/* Radio visual */}
      <span
        role="radio"
        aria-checked={selected}
        aria-label={selected ? "Selected" : "Not selected"}
        className={`inline-flex items-center justify-center rounded-full ml-3 ${
          description ? "mt-1" : ""
        } ${selected ? "border" : "invisible border"} w-6 h-6`}
        style={{ borderColor: color }}
      >
        {selected ? (
          <span
            className="block rounded-full w-3 h-3"
            style={{ backgroundColor: color }}
          />
        ) : null}
      </span>
    </button>
  );
}
