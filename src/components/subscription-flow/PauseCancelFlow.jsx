"use client";
import React, { useState } from "react";
import CustomImage from "../utils/CustomImage";
import PauseInsteadFlow from "./PauseInsteadFlow";
import CustomButton from "../utils/CustomButton";

export default function PauseCancelFlow({ subscription, onBack, onNavigate }) {
  const [showPauseInstead, setShowPauseInstead] = useState(false);
  const [selected] = useState(true);

  const { productName, productSubtitle, productImage, dosage } =
    subscription || {};
  const total = subscription?.total || "$121.00";

  if (showPauseInstead) {
    return (
      <PauseInsteadFlow
        onBack={() => setShowPauseInstead(false)}
        onComplete={() => onNavigate?.("adjustQuantity")}
      />
    );
  }

  return (
    <div className=" pb-24 max-w-[800px] mx-auto  md:px-0">
      <h2 className="font-medium text-[18px] leading-[115%] mb-4">
        Pause or cancel subscription
      </h2>
      {/* Selected product summary */}
      <div className="rounded-[16px] p-5 bg-white shadow-[0_0_16px_0_rgba(0,0,0,0.08)] h-[195px]">
        <div
          className={`flex items-center  rounded-[8px] p-4 gap-3 ${
            selected
              ? "border-[1.5px] border-[#AE7E56]"
              : "border border-[#E5E7EB]"
          }`}
        >
          <div className="w-12 h-12 overflow-hidden rounded-full relative">
            {productImage ? (
              <CustomImage
                src={productImage}
                alt={productName || "Product"}
                fill
                className="rounded-fulls"
              />
            ) : (
              <div className="w-full h-full bg-[#F3F4F6] rounded-full" />
            )}
          </div>
          <div className="flex-1 flex flex-col gap-1 ">
            <div className="text-[16px] font-medium  leading-[115%] ">
              {productName || "Generic Viagra"}
            </div>
            <div className="text-[14px] text-[#212121] leading-[140%]">
              {productSubtitle || "Sildenafil"}
            </div>
            <div className="text-[12px] text-[#5E5E5E] leading-[140%]">
              {dosage || "Viagra 10mg x 24 / 3-month"}
            </div>
          </div>
          <input
            type="checkbox"
            checked
            readOnly
            aria-label="Selected product"
            className="w-[20px] h-[20px] accent-[#AE7E56] rounded-[16px] cursor-default"
          />
        </div>
        <div className="mt-5 pt-5 border-t border-[#E5E7EB] flex items-center justify-between">
          <div className="text-[14px] font-medium leading-[140%]">Total</div>
          <div className="text-[14px] font-semibold leading-[140%]">
            {total}
          </div>
        </div>
      </div>
      {/* Actions fixed at the bottom of the page */}
      <div className="fixed left-0 right-0 bottom-0 z-20 py-5 bg-[#FBFAF9]  ">
        <div className="space-y-[10px] max-w-[800px] mx-auto px-5">
          <CustomButton
            onClick={() => setShowPauseInstead(true)}
            variant="rounded"
            width="full"
            size="medium"
            className=" w-full h-12 rounded-full border font-medium bg-black text-white text-[14px]"
          >
            Proceed To Cancel
          </CustomButton>
          <CustomButton
            onClick={onBack}
            className="w-full h-12 rounded-full border border-[#E2E2E1] text-[14px] bg-white text-[black] font-medium hover:bg-[#F9FAFB]"
          >
            Go Back
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
