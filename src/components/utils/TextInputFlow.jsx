"use client";
import React, { useState } from "react";
import Link from "next/link";
import CustomButton from "./CustomButton";

export default function TextInputFlow({
  title,
  description,
  placeholder = "",
  buttonLabel = "Continue",
  secondaryButtonLabel = "Go Back",
  onComplete,
  onBack,
  linkText,
  linkHref,
  bottomMessage,
  containerClassName = "max-w-[800px] mx-auto md:px-0",
  showBottomBackground = false,
}) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const trimmedText = text.trim();
    if (trimmedText && onComplete) {
      onComplete(trimmedText);
    }
  };

  return (
    <div className={`pb-24 ${containerClassName}`}>
      {title && (
        <h2 className="text-[18px] font-medium mb-2 leading-[115%]">{title}</h2>
      )}
      {description && (
        <p className="mb-6 text-[#595A5A] text-[14px] leading-[140%]">
          {description}
        </p>
      )}
      {linkText && linkHref && (
        <p className="mb-6 text-[#595A5A] text-[14px] leading-[140%]">
          Changed your mind?{" "}
          <Link
            href={linkHref}
            className="underline underline-offset-2 text-[#212121]"
          >
            {linkText}
          </Link>
        </p>
      )}

      <div className="rounded-[16px]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full h-40 border border-[#E5E7EB] rounded-[12px] p-3 outline-none focus:ring-2 focus:ring-[#E5E7EB]"
        />
      </div>

      {bottomMessage && (
        <div className="mt-3 text-center text-[12px] text-[#7D7C77]">
          {bottomMessage}
        </div>
      )}

      <div
        className={`fixed left-0 right-0 bottom-0 z-20 py-5 ${
          showBottomBackground ? "bg-[#FBFAF9]" : ""
        }`}
      >
        <div className="space-y-[10px] max-w-[800px] mx-auto px-5">
          <CustomButton
            width="full"
            size="medium"
            variant="pill"
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="text-white text-[15px] font-medium disabled:bg-[#E5E7EB] disabled:text-[#7D7C77] disabled:opacity-100 bg-black hover:opacity-90 h-12"
          >
            {buttonLabel}
          </CustomButton>
          {onBack && (
            <CustomButton
              width="full"
              size="medium"
              variant="pill"
              onClick={onBack}
              className="border border-[#E2E2E1] text-[14px] bg-white text-[black] font-medium hover:bg-[#F9FAFB] h-12"
            >
              {secondaryButtonLabel}
            </CustomButton>
          )}
        </div>
      </div>
    </div>
  );
}
