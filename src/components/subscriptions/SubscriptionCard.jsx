"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CustomButton from "../utils/CustomButton";
import CustomImage from "../utils/CustomImage";
import StatusBadge from "../utils/StatusBadge";
import GetRefillModal from "../subscription-flow/GetRefillModal";
import { toast } from "react-toastify";
import { FaArrowRight } from "react-icons/fa";
import PropTypes from "prop-types";

export default function SubscriptionCard({ subscription, onAction }) {
  const router = useRouter();
  const [isRequestRefillModalOpen, setIsRequestRefillModalOpen] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = (actionLabel) => {
    if (onAction) {
      onAction(subscription, actionLabel);
    }
  };

  const handleSeePrescription = () => {
    router.push("/prescriptions");
  };

  const handleMessageProvider = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API endpoint when available
      // const response = await fetch(`/api/subscriptions/${subscription.id}/message-provider`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error("Failed to initiate message");
      // }

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Navigate to messages page after API call
      router.push("/messages");
    } catch (error) {
      console.error("Error messaging provider:", error);
      toast.error(error.message || "Failed to message provider");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestRefillConfirm = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API endpoint when available
      // const response = await fetch(`/api/subscriptions/${subscription.id}/refill`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error("Failed to request refill");
      // }

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Refill order has been placed successfully");
      setIsRequestRefillModalOpen(false);
    } catch (error) {
      console.error("Error requesting refill:", error);
      toast.error(error.message || "Failed to request refill");
    } finally {
      setIsLoading(false);
    }
  };

  const actionButtons = [
    {
      label: "See prescription",
      onClick: handleSeePrescription,
    },
    {
      label: "Message provider",
      onClick: handleMessageProvider,
    },
    {
      label: "Request refill",
      onClick: () => setIsRequestRefillModalOpen(true),
      disabled: subscription.status === "canceled",
    },
    {
      label: "Manage subscription",
      onClick: () => handleAction("Manage subscription"),
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
            className="bg-white border border-[#E2E2E1] text-[#212121] hover:bg-black hover:text-white h-[40px] text-[14px]"
          />
        ))}
      </div>

      {/* Request Refill Confirmation Modal */}
      <GetRefillModal
        isOpen={isRequestRefillModalOpen}
        onClose={() => !isLoading && setIsRequestRefillModalOpen(false)}
        onConfirm={handleRequestRefillConfirm}
      />
    </div>
  );
}

SubscriptionCard.propTypes = {
  subscription: PropTypes.object.isRequired,
  onAction: PropTypes.func,
};
