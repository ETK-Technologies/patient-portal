import React from "react";
import RadioOption from "./RadioOption";
import CustomButton from "./CustomButton";

export default function RadioOptionsScreen({
  title,
  description,
  options = [],
  selectedValue,
  onChange,
  color = "#AE7E56",
  continueText = "Continue",
  backText = "Go Back",
  onContinue,
  onBack,
  containerClassName = "",
}) {
  return (
    <div className={`pb-24 max-w-[800px] mx-auto ${containerClassName}`}>
      {title ? (
        <h2 className="text-[18px] font-medium mb-2 leading-[115%]">{title}</h2>
      ) : null}
      {description ? (
        <p className="mb-6 text-[#595A5A] text-[14px] leading-[140%]">
          {description}
        </p>
      ) : null}

      <div className="rounded-[16px]">
        <div className="space-y-2">
          {options.map((opt) => (
            <RadioOption
              key={opt.value}
              label={opt.label}
              description={opt.description}
              selected={selectedValue === opt.value}
              onClick={() => onChange?.(opt.value)}
              color={color}
            />
          ))}
        </div>
      </div>

      <div className="fixed left-0 right-0 bottom-0 z-20 py-5 bg-[#FBFAF9]">
        <div className="space-y-[10px] max-w-[800px] mx-auto px-5">
          <CustomButton
            width="full"
            size="medium"
            variant="pill"
            disabled={!selectedValue}
            onClick={() => selectedValue && onContinue?.(selectedValue)}
            className="text-white text-[15px] font-medium disabled:bg-[#E5E7EB] disabled:text-[#7D7C77] disabled:opacity-100 bg-black hover:opacity-90 h-12"
          >
            {continueText}
          </CustomButton>
          {onBack ? (
            <CustomButton
              width="full"
              size="medium"
              variant="pill"
              onClick={onBack}
              className="border border-[#E2E2E1] text-[14px] bg-white text-[black] font-medium hover:bg-[#F9FAFB] h-12"
            >
              {backText}
            </CustomButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
