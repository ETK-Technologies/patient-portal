"use client";
import React from "react";
import CustomImage from "../utils/CustomImage";
import { FaArrowRight } from "react-icons/fa6";
import CustomButton from "../utils/CustomButton";

export default function CancelWhatToExpectFlow({ subscription, onDone, onCloseFlow }) {
  const { productImage, category } = subscription || {};
  const reactivationDate = subscription?.reactivationDate || "{date}";

  const handleBackToSubscription = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCloseFlow) {
      onCloseFlow();
    }
  };

  return (
    <div className="pb-24 w-full md:w-[528px] mx-auto md:px-0">
      <h2 className="text-[18px] font-medium mb-2 leading-[115%]">
        What to expect after cancelling
      </h2>
      <p className="mb-6 text-[#595A5A] text-[14px] leading-[140%]">
        Changed your mind? {""}
        <button
          type="button"
          onClick={handleBackToSubscription}
          className="underline underline-offset-2 text-[#212121] cursor-pointer hover:opacity-80 bg-transparent border-none p-0"
        >
          Back to subscription
        </button>
      </p>

      <div className="rounded-[16px] border border-[#E5E7EB] bg-white mb-4 flex items-center justify-center">
        {productImage ? (
          <div className="relative w-full md:h-[335px] h-[188px] md:mx-auto">
            <CustomImage
              src={productImage}
              alt="Product"
              width={335}
              height={188}
              className="rounded-[12px] w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-40 h-28 bg-[#F3F4F6] rounded-[8px]" />
        )}
      </div>

      <div className="rounded-[16px] space-y-6 flex flex-col justify-between h-[368px] md:h-auto border border-[#E5E7EB] bg-white p-5 mb-6">
        <div>
          <div className="font-semibold mb-1">Subscription ends</div>
          <p className="text-sm text-[#4B5563]">
            Once you confirm, your plan will end on the last day of your current
            subscription period.
          </p>
        </div>
        <div>
          <div className="font-semibold mb-1">
            Easy reactivation until {reactivationDate}
          </div>
          <p className="text-sm text-[#4B5563]">
            Your prescription will remain active before {reactivationDate}.
            After that, you will need a new prescription to get medication.
          </p>
        </div>
        <div>
          <div className="font-semibold mb-1">Lose Medical Support</div>
          <p className="text-sm text-[#4B5563]">
            After your plan ends, you’ll no longer have access to unlimited
            provider messaging, treatment support or personalized medical advice{" "}
            {category ? `(${category})` : "{category}"}.
          </p>
        </div>
      </div>

      <section className="mb-10">
        <h3 className="text-[20px] font-semibold mb-4 ">Get help</h3>
        <div className="bg-white rounded-[12px] border border-[#E5E7EB] shadow-sm divide-y divide-[#E2E2E1] p-5">
          <button className="w-full text-left hover:bg-[#F9FAFB] h-auto p-0">
            <div className="w-full ">
              <div className="text-xs text-[#5E5E5E] mb-1">
                Medical questions
              </div>
              <div className="flex items-center justify-between mb-4  ">
                <div className="text-[16px] font-medium">
                  Chat with a provider
                </div>
                <FaArrowRight size={18} />
              </div>
            </div>
          </button>
          <button className="w-full text-left hover:bg-[#F9FAFB] h-auto p-0 mt-4">
            <div className="w-full">
              <div className="text-xs text-[#5E5E5E] mb-1">
                Account & order questions
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-[16px] font-medium">
                  Contact customer support
                </div>
                <FaArrowRight size={18} />
              </div>
            </div>
          </button>
        </div>
      </section>

      <div className="fixed left-0 right-0 bottom-0 z-20 py-5 bg-[#FBFAF9]">
        <div className="max-w-[800px] mx-auto px-5 md:px-6 md:pl-[60px]">
          <div className="space-y-[10px] w-full md:w-[528px] mx-auto">
            <CustomButton
              width="full"
              size="medium"
              variant="pill"
              onClick={onDone}
              className="text-white text-[15px] font-medium bg-black hover:opacity-90 h-12"
            >
              Continue with cancellation
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
}
