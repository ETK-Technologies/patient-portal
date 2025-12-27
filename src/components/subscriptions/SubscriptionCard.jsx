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
import { downloadPrescriptionPDF } from "@/utils/pdfGenerator";

export default function SubscriptionCard({ subscription, onAction }) {
  const router = useRouter();
  const [isRequestRefillModalOpen, setIsRequestRefillModalOpen] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrescription, setIsLoadingPrescription] = useState(false);

  const handleAction = (actionLabel) => {
    if (onAction) {
      onAction(subscription, actionLabel);
    }
  };

  const handleSeePrescription = async () => {
    const prescription = subscription._raw?.prescription;
    
    if (!prescription || !prescription.id) {
      toast.error("Prescription not available for this subscription");
      return;
    }

    try {
      setIsLoadingPrescription(true);
      await downloadPrescriptionPDF(prescription.id, { openInNewTab: true });
    } catch (error) {
      console.error("Error opening prescription:", error);
      toast.error(error.message || "Failed to open prescription. Please try again.");
    } finally {
      setIsLoadingPrescription(false);
    }
  };

  const handleMessageProvider = async () => {
    try {
      setIsLoading(true);

      const subscriptionId = subscription.id || subscription.subscription_id;
      
      if (!subscriptionId) {
        throw new Error("Subscription ID not found");
      }

      // Get userId from cookies
      const getUserIdFromCookies = () => {
        if (typeof document === "undefined") return null;
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
          const [name, value] = cookie.trim().split("=");
          if (name === "userId") {
            return decodeURIComponent(value);
          }
        }
        return null;
      };

      const userId = getUserIdFromCookies();
      
      if (!userId) {
        toast.error("User ID not found. Please log in again.");
        setIsLoading(false);
        return;
      }

      // Call API to get the thread and chat URL
      const response = await fetch(
        `/api/messenger/subscription-thread?subscriptionId=${subscriptionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to connect to messenger");
      }

      const result = await response.json();

      if (result.success && result.loginURL) {
        window.open(result.loginURL, "_blank", "noopener,noreferrer");
        toast.success("Opening messenger...");
      } else if (result.success && result.chatUrl) {
        // Fallback: if no loginURL, use chatUrl
        window.open(result.chatUrl, "_blank", "noopener,noreferrer");
        toast.success("Opening chat with provider...");
      } else {
        throw new Error(result.error || "No login URL received");
      }
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
      
      const subscriptionId = subscription.id || subscription.subscription_id;
      
      if (!subscriptionId) {
        throw new Error("Subscription ID not found");
      }

      const response = await fetch("/api/user/refill-subscription-renewal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          subscription_id: subscriptionId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "Failed to request refill");
      }

      toast.success("Refill order has been placed successfully");
      setIsRequestRefillModalOpen(false);
    } catch (error) {
      console.error("Error requesting refill:", error);
      toast.error(error.message || "Failed to request refill");
    } finally {
      setIsLoading(false);
    }
  };

  const prescription = subscription._raw?.prescription;
  const isPrescriptionAvailable = prescription && prescription.id;

  const actionButtons = [
    {
      label: isLoadingPrescription ? "Opening..." : "See prescription",
      onClick: handleSeePrescription,
      disabled: !isPrescriptionAvailable || isLoadingPrescription,
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
