"use client";
import React, { useState } from "react";

export default function CancelReasonTextFlow({ onBack, onComplete }) {
  const [text, setText] = useState("");

  return (
    <div className="pb-24 max-w-[800px] mx-auto md:px-0">
      <h2 className="text-[18px] font-medium mb-2 leading-[115%]">
        If your treatment worked for you, what’s the reason you’d like to
        cancel?
      </h2>
      <p className="mb-6 text-[#595A5A] text-[14px] leading-[140%]">
        We love blunt feedback.
      </p>

      <div className="rounded-[16px]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="My treatment worked but..."
          className="w-full h-40 border border-[#E5E7EB] rounded-[12px] p-3 outline-none focus:ring-2 focus:ring-[#E5E7EB]"
        />
      </div>

      <div className="fixed left-0 right-0 bottom-0 z-20 py-5">
        <div className="space-y-[10px] max-w-[800px] mx-auto px-5">
          <button
            className="w-full h-12 rounded-full text-white text-[15px] font-medium disabled:bg-[#E5E7EB] disabled:text-[#7D7C77] bg-black hover:opacity-90"
            disabled={!text.trim()}
            onClick={() => text.trim() && onComplete?.(text.trim())}
          >
            Continue
          </button>
          {onBack ? (
            <button
              onClick={onBack}
              className="w-full h-12 rounded-full border border-[#E2E2E1] text-[14px] bg-white text-[black] font-medium hover:bg-[#F9FAFB]"
            >
              Go Back
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
