import React from "react";
import { FiCheck } from "react-icons/fi";

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
      className={`w-full text-left rounded-[8px] border p-4 min-h-[52px] flex ${
        description ? "items-start" : "items-center"
      } justify-between transition-colors cursor-pointer ${
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
        className={`inline-flex items-center justify-center ml-3 ${
          description ? "mt-1" : ""
        } border w-5 h-5 rounded-[4px] ${
          checked ? "" : "bg-[#00000033] border-[#E5E7EB]"
        }`}
        style={{
          borderColor: checked ? color : "#E5E7EB",
          backgroundColor: checked ? color : "#E5E7EB",
        }}
      >
        {checked ? (
          <FiCheck size={14} color="#FFFFFF" strokeWidth={3.2} />
        ) : (
          <FiCheck
            size={16}
            color="#FFFFFF"
            strokeWidth={3.2}
            className="opacity-40"
          />
        )}
      </span>
    </button>
  );
}
