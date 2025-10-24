"use client";

import CustomButton from "../utils/CustomButton";
import CustomImage from "../utils/CustomImage";
import StatusBadge from "../utils/StatusBadge";
import { FaArrowRight } from "react-icons/fa";

export default function SubscriptionCard({ subscription }) {
  const actionButtons = [
    {
      label: "See prescription",
      onClick: () => console.log("See prescription"),
    },
    {
      label: "Message provider",
      onClick: () => console.log("Message provider"),
    },
    {
      label: "Request refill",
      onClick: () => console.log("Request refill"),
      disabled: subscription.status === "canceled",
    },
    {
      label: "Manage subscription",
      onClick: () => console.log("Manage subscription"),
    },
  ];

  return (
    <div className="bg-white w-[272px] md:w-[324px] h-[436px] md:h-[436px] shadow-[0px_0px_16px_0px_#00000014] rounded-[16px] p-6 mb-3">
      {/* Status Badge */}
      <div className="w-full mb-4">
        <StatusBadge
          status={subscription.status}
          className="w-full flex items-center justify-center"
        />
      </div>

      {/* Product Info */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[14px] md:text-[16px] font-[500] leading-[115%] mb-[4px]">
            {subscription.productName}
          </h3>
          {subscription.productSubtitle && (
            <p className="text-[12px] font-[400] leading-[140%] text-[#212121]">
              {subscription.productSubtitle}
            </p>
          )}
        </div>
        <div className="w-10 h-10 overflow-hidden rounded-[8px] relative flex-shrink-0">
          <CustomImage
            src={subscription.productImage}
            alt={subscription.productName}
            fill
          />
        </div>
      </div>

      {/* Dosage Info */}
      <p className="text-[12px] font-[400] leading-[140%] text-[#212121] mb-3">
        {subscription.dosage}
      </p>

      {/* Next Refill */}
      <div className="mb-4">
        <p className="text-[12px] font-[500] leading-[140%] mb-[2px] text-[#00000099]">
          Next Refill
        </p>
        <p className="text-[12px] font-[500] leading-[140%] text-[#212121]">
          {subscription.nextRefill}
        </p>
      </div>

      <div className="border-t border-[#E2E2E1] mt-[33px] mb-4"></div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        {actionButtons.map((button, index) => (
          <CustomButton
            key={index}
            text={button.label}
            icon={<FaArrowRight />}
            onClick={button.onClick}
            disabled={button.disabled}
            size="small"
            width="full"
            variant="pill"
            justify="between"
            className="bg-white border border-[#E2E2E1] text-[#212121] hover:bg-[#F9F9F9] h-[40px] text-[14px]"
          />
        ))}
      </div>
    </div>
  );
}
