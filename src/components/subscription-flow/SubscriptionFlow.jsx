"use client";
import React, { useEffect, useState } from "react";
import CustomImage from "../utils/CustomImage";
import PauseCancelFlow from "./PauseCancelFlow";
import AdjustQuantityFlow from "./AdjustQuantityFlow";
import TreatmentFeedbackFlow from "./TreatmentFeedbackFlow";
import CancelReasonTextFlow from "./CancelReasonTextFlow";
import CancelReasonChecklistFlow from "./CancelReasonChecklistFlow";
import CancelWhatToExpectFlow from "./CancelWhatToExpectFlow";
import CancelFinalFeedbackFlow from "./CancelFinalFeedbackFlow";
import Section from "../utils/Section";
import CustomButton from "../utils/CustomButton";
import { FaRegCalendarAlt, FaRegClock } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa6";

export default function SubscriptionFlow({
  subscription,
  action,
  setShowHeader,
  setHeaderVariant,
}) {
  const [activeSubpanel, setActiveSubpanel] = useState(null); // null | 'pauseCancel' | 'adjustQuantity' | 'treatmentFeedback' | 'cancelReasonText' | 'cancelReasonChecklist' | 'cancelInfo' | 'cancelFinal'

  useEffect(() => {
    // Keep header visible; switch variant based on whether we're on the main details panel
    if (typeof setShowHeader === "function") {
      setShowHeader(true);
    }
    if (typeof setHeaderVariant === "function") {
      setHeaderVariant(activeSubpanel === null ? "full" : "backOnly");
    }
  }, [activeSubpanel, setShowHeader, setHeaderVariant]);

  const {
    productName,
    productSubtitle,
    productImage,
    nextRefill,
    dosage,
    status,
    category,
  } = subscription || {};

  const quantityText = subscription?.quantity || "8 pills / month";
  const shippingFrequencyText = subscription?.shippingFrequency || "3 months";
  const shippingAddress =
    subscription?.shippingAddress ||
    "15 – 5270 Solar Dr Mississauga, ON L4W 5M8";
  const paymentMethod = subscription?.paymentMethod || "•••• •••• 3344";
  const treatmentInstructions =
    subscription?.treatmentInstructions ||
    "Take 1 tablet by mouth as needed 2 hours before sex. Do not take more than 1 tablet daily.";

  // Subpanel routing
  if (activeSubpanel === "pauseCancel") {
    return (
      <PauseCancelFlow
        subscription={subscription}
        onBack={() => setActiveSubpanel(null)}
        onNavigate={(panel) => setActiveSubpanel(panel)}
      />
    );
  }
  if (activeSubpanel === "adjustQuantity") {
    return (
      <AdjustQuantityFlow
        onBack={() => setActiveSubpanel("pauseCancel")}
        onComplete={() => setActiveSubpanel("treatmentFeedback")}
      />
    );
  }
  if (activeSubpanel === "treatmentFeedback") {
    return (
      <TreatmentFeedbackFlow
        onBack={() => setActiveSubpanel("adjustQuantity")}
        onComplete={(answer) =>
          setActiveSubpanel(
            answer === "yes" ? "cancelReasonText" : "cancelReasonChecklist"
          )
        }
      />
    );
  }
  if (activeSubpanel === "cancelReasonText") {
    return (
      <CancelReasonTextFlow
        onBack={() => setActiveSubpanel("treatmentFeedback")}
        onComplete={() => setActiveSubpanel("cancelInfo")}
      />
    );
  }
  if (activeSubpanel === "cancelReasonChecklist") {
    return (
      <CancelReasonChecklistFlow
        onBack={() => setActiveSubpanel("treatmentFeedback")}
        onComplete={() => setActiveSubpanel("cancelInfo")}
      />
    );
  }
  if (activeSubpanel === "cancelInfo") {
    return (
      <CancelWhatToExpectFlow
        subscription={subscription}
        onBack={() => setActiveSubpanel("treatmentFeedback")}
        onDone={() => setActiveSubpanel("cancelFinal")}
      />
    );
  }
  if (activeSubpanel === "cancelFinal") {
    return (
      <CancelFinalFeedbackFlow
        onBack={() => setActiveSubpanel("cancelInfo")}
        onSubmit={() => setActiveSubpanel(null)}
      />
    );
  }

  return (
    <Section className="space-y-6 md:space-y-8 pt-0">
      {/* Main card */}
      <div className="bg-white rounded-[16px] shadow-[0px_0px_16px_0px_#00000014] border border-[#E5E7EB] p-5 md:p-6">
        {/* Header product block */}
        <div className="flex items-start justify-between">
          <div className="flex-1 gap-1">
            <h2 className="text-[18px] font-semibold leading-[120%]">
              {productName || "Generic Viagra"}
            </h2>
            <p className="text-sm text-[#212121] mt-1">
              {productSubtitle || "Sildenafil"}
            </p>
          </div>
          <div className="w-12 h-12 overflow-hidden rounded-full relative flex-shrink-0">
            {productImage ? (
              <CustomImage
                src={productImage}
                alt={productName || "Product"}
                fill
              />
            ) : (
              <div className="w-full h-full bg-[#F3F4F6] rounded-[8px]" />
            )}
          </div>
        </div>

        {/* Next refill pill */}
        <div className="mt-6 w-full">
          <div className="bg-[#F5F7F3] text-[#23221C] text-sm rounded-[10px] px-4 py-3 w-full text-center">
            <span className="text-[#7D7C77] mr-1">Next refill:</span>
            <span className="font-medium">{nextRefill || "Oct 15, 2025"}</span>
          </div>
        </div>

        {/* Two action tiles */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <CustomButton
            variant="rounded"
            width="full"
            justify="start"
            className="text-left border border-[#E5E7EB] p-4 hover:bg-[#F9FAFB] h-auto"
          >
            <div className="flex flex-col">
              <div className="text-[22px] mb-2">
                <FaRegClock size={22} />
              </div>
              <div className="text-[16px] font-medium leading-[140%]">
                Get refill
              </div>
              <div className="text-sm text-[#5E5E5E]">Refill option</div>
            </div>
          </CustomButton>
          <CustomButton
            variant="rounded"
            width="full"
            justify="start"
            className="text-left border border-[#E5E7EB] p-4 hover:bg-[#F9FAFB] h-auto"
          >
            <div className="flex flex-col">
              <div className="text-[22px] mb-2">
                <FaRegCalendarAlt size={22} />
              </div>
              <div className="text-[16px] font-medium leading-[140%]">
                Change refill date
              </div>
              <div className="text-sm text-[#5E5E5E]">Adjust next order</div>
            </div>
          </CustomButton>
        </div>

        <div className="my-6 border-t border-[#E5E7EB]"></div>

        {/* My Treatment */}
        <section>
          <h3 className="text-[18px] font-semibold mb-4">My Treatment</h3>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[16px] font-medium">Quantity</div>
                <div className="text-sm text-[#5E5E5E] mt-1">
                  {quantityText}
                </div>
              </div>
              <CustomButton
                width="fit"
                size="small"
                variant="rounded"
                className="text-[14px] font-medium text-[#111827] underline h-auto p-0"
              >
                Adjust
              </CustomButton>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[16px] font-medium">
                  Shipping frequency
                </div>
                <div className="text-sm text-[#5E5E5E] mt-1">
                  {shippingFrequencyText}
                </div>
              </div>
              <CustomButton
                width="fit"
                size="small"
                variant="rounded"
                className="text-[14px] font-medium text-[#111827] underline h-auto p-0"
              >
                Adjust
              </CustomButton>
            </div>
          </div>
        </section>

        <div className="my-5 border-t border-[#E5E7EB]"></div>

        {/* Shipping */}
        <section>
          <h3 className="text-[18px] font-semibold mb-4">Shipping</h3>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[16px] font-medium">Ships to</div>
              <div className="text-sm text-[#5E5E5E] mt-1 whitespace-pre-line">
                {shippingAddress}
              </div>
            </div>
            <CustomButton
              width="fit"
              size="small"
              variant="rounded"
              className="text-[14px] font-medium text-[#111827] underline h-auto p-0"
            >
              Edit
            </CustomButton>
          </div>
        </section>

        <div className="my-5 border-t border-[#E5E7EB]"></div>

        {/* Payment */}
        <section>
          <h3 className="text-[18px] font-semibold mb-4">Payment</h3>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[16px] font-medium">Default card</div>
              <div className="text-sm text-[#5E5E5E] mt-1">{paymentMethod}</div>
            </div>
            <CustomButton
              width="fit"
              size="small"
              variant="rounded"
              className="text-[14px] font-medium text-[#111827] underline h-auto p-0"
            >
              Edit
            </CustomButton>
          </div>
        </section>
      </div>

      {/* Treatment Plan block under card */}
      <section>
        <h3 className="text-[20px] font-semibold mb-4">Treatment Plan</h3>
        <div className="bg-white rounded-[12px] border border-[#E5E7EB] shadow-sm p-4">
          <div className="text-[16px] font-semibold mb-2">How to take</div>
          <p className="text-sm text-[black] leading-relaxed">
            {treatmentInstructions}
          </p>
        </div>
      </section>

      {/* Get help block under card */}
      <section>
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
          <button
            onClick={() => setActiveSubpanel("cancelReasonText")}
            className="w-full text-left hover:bg-[#F9FAFB] h-auto p-0 mt-4"
          >
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
          <button
            onClick={() => setActiveSubpanel("pauseCancel")}
            className="w-full text-left hover:bg-[#F9FAFB] h-auto p-0 mt-4"
          >
            <div className="w-full">
              <div className="text-xs text-[#5E5E5E] mb-1">
                Additional options
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-[16px] font-medium">
                  Skip your next order
                </div>
                <FaArrowRight size={18} />
              </div>
            </div>
          </button>
          <button
            onClick={() => setActiveSubpanel("pauseCancel")}
            className="w-full text-left hover:bg-[#F9FAFB] h-auto p-0 mt-4"
          >
            <div className="w-full">
              <div className="text-xs text-[#5E5E5E] mb-1">
                Additional options
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-[16px] font-medium">
                  Pause/Cancel Subscription
                </div>
                <FaArrowRight size={18} />
              </div>
            </div>
          </button>
        </div>
      </section>
    </Section>
  );
}
