"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import CustomImage from "../utils/CustomImage";
import { useSubscriptionFlow } from "./hooks/useSubscriptionFlow";
import { subscriptionFlowConfig } from "./config/subscriptionFlowConfig";
import SubscriptionStepRenderer from "./SubscriptionStepRenderer";
import Section from "../utils/Section";
import CustomButton from "../utils/CustomButton";
import UpdateModal from "../utils/UpdateModal";
import ShippingAddressModal from "../billing-shipping/ShippingAddressModal";
import QuantityFrequencyModal from "./QuantityFrequencyModal";
import GetRefillModal from "./GetRefillModal";
import ChangeRefillDateModal from "./ChangeRefillDateModal";
import StatusBadge from "../utils/StatusBadge";
import { useUser } from "@/contexts/UserContext";
import { toast } from "react-toastify";
import { FaRegCalendarAlt } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa6";
import { FaArrowsRotate } from "react-icons/fa6";
import { FaRegCalendar } from "react-icons/fa6";

export default function SubscriptionFlow({
  subscription,
  action,
  setShowHeader,
  setHeaderVariant,
  onBackHandler,
}) {
  // Initialize flow state - start at null (main view) unless action indicates otherwise
  const initialStep = action === "Manage subscription" ? null : null;
  const flowState = useSubscriptionFlow(subscription, initialStep);
  const { stepIndex, handleNavigate, handleBack } = flowState;

  // Pass handleBack and stepIndex to parent component for header back button
  // Use a ref to store the callback to avoid infinite loops
  const onBackHandlerRef = React.useRef(onBackHandler);

  React.useEffect(() => {
    onBackHandlerRef.current = onBackHandler;
  }, [onBackHandler]);

  // Update immediately on mount and when stepIndex changes
  useEffect(() => {
    if (typeof onBackHandlerRef.current === "function") {
      onBackHandlerRef.current({ handleBack, stepIndex });
    }
    // Only depend on stepIndex - handleBack is stable from the hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  // Also update on mount to ensure handler is set when flow is reopened
  useEffect(() => {
    if (typeof onBackHandler === "function") {
      onBackHandler({ handleBack, stepIndex });
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper function to extract initial values from subscription
  const getInitialValues = () => {
    if (subscription?._raw) {
      const rawSub = subscription._raw;
      const firstLineItem = rawSub.line_items?.[0];

      // Quantity
      let quantity = "Not available";
      if (firstLineItem) {
        const tabsFrequency =
          firstLineItem.meta_data?.find((m) => m.key === "pa_tabs-frequency")
            ?.display_value || "";
        if (tabsFrequency) {
          quantity = `${tabsFrequency} / month`;
        } else {
          const qty = firstLineItem.quantity || 1;
          quantity = `${qty} ${qty === 1 ? "item" : "items"} / month`;
        }
      }

      // Shipping frequency
      let shippingFreq = "Not available";
      if (rawSub.billing_period && rawSub.billing_interval) {
        const interval = parseInt(rawSub.billing_interval);
        const period = rawSub.billing_period;
        shippingFreq =
          interval === 1 ? `1 ${period}` : `${interval} ${period}s`;
      }

      // Shipping address
      let shippingAddr = "Not available";
      let shippingDataObj = null;
      const shipping = rawSub.shipping || rawSub.billing || {};
      const cleanAddress1 =
        shipping.address_1 && shipping.address_1 !== "[deleted]"
          ? shipping.address_1
          : "";
      if (cleanAddress1) {
        const addressParts = [
          cleanAddress1,
          shipping.address_2 && shipping.address_2 !== "[deleted]"
            ? shipping.address_2
            : "",
          shipping.city && shipping.city !== "[deleted]" ? shipping.city : "",
          shipping.state && shipping.state !== "[deleted]"
            ? shipping.state
            : "",
          shipping.postcode && shipping.postcode !== "[deleted]"
            ? shipping.postcode
            : "",
        ].filter(Boolean);
        shippingAddr = addressParts.join(", ");

        shippingDataObj = {
          id: null,
          shipping_address_id: null,
          first_name:
            shipping.first_name && shipping.first_name !== "[deleted]"
              ? shipping.first_name
              : "",
          last_name:
            shipping.last_name && shipping.last_name !== "[deleted]"
              ? shipping.last_name
              : "",
          email:
            (shipping.email && shipping.email !== "[deleted]"
              ? shipping.email
              : "") ||
            (rawSub.billing?.email && rawSub.billing.email !== "[deleted]"
              ? rawSub.billing.email
              : "") ||
            "",
          address_1: cleanAddress1,
          address_2:
            shipping.address_2 && shipping.address_2 !== "[deleted]"
              ? shipping.address_2
              : "",
          city:
            shipping.city && shipping.city !== "[deleted]" ? shipping.city : "",
          postcode:
            shipping.postcode && shipping.postcode !== "[deleted]"
              ? shipping.postcode
              : "",
          country:
            shipping.country && shipping.country !== "[deleted]"
              ? shipping.country
              : "CA",
          state:
            shipping.state && shipping.state !== "[deleted]"
              ? shipping.state
              : "",
        };
      }

      // Payment method
      const paymentMethod =
        rawSub.payment_method_title || rawSub.payment_method || "Not available";

      return {
        quantity,
        shippingFreq,
        shippingAddr,
        shippingDataObj,
        paymentMethod,
      };
    }

    // Fallback to mapped subscription data (dummy data)
    return {
      quantity: subscription?.quantity || "Not available",
      shippingFreq: subscription?.shippingFrequency || "Not available",
      shippingAddr: subscription?.shippingAddress || "Not available",
      shippingDataObj: null,
      paymentMethod: subscription?.paymentMethod || "Not available",
    };
  };

  // Helper to get initial values - will be recalculated when subscription changes
  const getInitialValuesForState = () => {
    if (subscription?._raw) {
      const rawSub = subscription._raw;
      const firstLineItem = rawSub.line_items?.[0];

      let quantity = "Not available";
      if (firstLineItem) {
        const tabsFrequency =
          firstLineItem.meta_data?.find((m) => m.key === "pa_tabs-frequency")
            ?.display_value || "";
        if (tabsFrequency) {
          quantity = `${tabsFrequency} / month`;
        } else {
          const qty = firstLineItem.quantity || 1;
          quantity = `${qty} ${qty === 1 ? "item" : "items"} / month`;
        }
      }

      let shippingFreq = "Not available";
      if (rawSub.billing_period && rawSub.billing_interval) {
        const interval = parseInt(rawSub.billing_interval);
        const period = rawSub.billing_period;
        shippingFreq =
          interval === 1 ? `1 ${period}` : `${interval} ${period}s`;
      }

      const shipping = rawSub.shipping || rawSub.billing || {};
      const cleanAddress1 =
        shipping.address_1 && shipping.address_1 !== "[deleted]"
          ? shipping.address_1
          : "";
      let shippingAddr = "Not available";
      if (cleanAddress1) {
        const addressParts = [
          cleanAddress1,
          shipping.address_2 && shipping.address_2 !== "[deleted]"
            ? shipping.address_2
            : "",
          shipping.city && shipping.city !== "[deleted]" ? shipping.city : "",
          shipping.state && shipping.state !== "[deleted]"
            ? shipping.state
            : "",
          shipping.postcode && shipping.postcode !== "[deleted]"
            ? shipping.postcode
            : "",
        ].filter(Boolean);
        shippingAddr = addressParts.join(", ");
      }

      const paymentMethod =
        rawSub.payment_method_title || rawSub.payment_method || "Not available";

      return { quantity, shippingFreq, shippingAddr, paymentMethod };
    }

    // Fallback to dummy data
    return {
      quantity: subscription?.quantity || "Not available",
      shippingFreq: subscription?.shippingFrequency || "Not available",
      shippingAddr: subscription?.shippingAddress || "Not available",
      paymentMethod: subscription?.paymentMethod || "Not available",
    };
  };

  const initialValues = getInitialValues();

  // Local state for modals and subscription details
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [isShippingFrequencyModalOpen, setIsShippingFrequencyModalOpen] =
    useState(false);
  const [localQuantity, setLocalQuantity] = useState(() => {
    // Initialize from subscription if available, otherwise use initialValues
    return subscription?.quantity || initialValues.quantity || "Not available";
  });
  const [localShippingFrequency, setLocalShippingFrequency] = useState(() => {
    return (
      subscription?.shippingFrequency ||
      initialValues.shippingFreq ||
      "Not available"
    );
  });
  const [isShippingAddressModalOpen, setIsShippingAddressModalOpen] =
    useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] =
    useState(false);
  const [isGetRefillModalOpen, setIsGetRefillModalOpen] = useState(false);
  const [isChangeRefillDateModalOpen, setIsChangeRefillDateModalOpen] =
    useState(false);
  const [localShippingAddress, setLocalShippingAddress] = useState(() => {
    return (
      subscription?.shippingAddress ||
      initialValues.shippingAddr ||
      "Not available"
    );
  });
  const [shippingData, setShippingData] = useState(
    initialValues.shippingDataObj
  );
  const [localPaymentMethod, setLocalPaymentMethod] = useState({
    cardNumber: "",
    expiry: "",
    cvc: "",
    nameOnCard: "",
  });
  const [displayPaymentMethod, setDisplayPaymentMethod] = useState(() => {
    return (
      subscription?.paymentMethod ||
      initialValues.paymentMethod ||
      "Not available"
    );
  });
  const { userData } = useUser();

  useEffect(() => {
    // Keep header visible; switch variant based on whether we're on the main details panel
    if (typeof setShowHeader === "function") {
      setShowHeader(true);
    }
    if (typeof setHeaderVariant === "function") {
      setHeaderVariant(stepIndex === null ? "full" : "backOnly");
    }
  }, [stepIndex, setShowHeader, setHeaderVariant]);

  useEffect(() => {
    // Extract data from subscription._raw (API response)
    if (subscription?._raw) {
      const rawSub = subscription._raw;

      // Extract quantity from line_items
      const firstLineItem = rawSub.line_items?.[0];
      if (firstLineItem) {
        const quantity = firstLineItem.quantity || 1;
        const tabsFrequency =
          firstLineItem.meta_data?.find((m) => m.key === "pa_tabs-frequency")
            ?.display_value || "";

        // Format quantity display (e.g., "4 Tabs / month")
        if (tabsFrequency) {
          setLocalQuantity(`${tabsFrequency} / month`);
        } else {
          setLocalQuantity(
            `${quantity} ${quantity === 1 ? "item" : "items"} / month`
          );
        }
      }

      // Extract shipping frequency from billing_period and billing_interval
      if (rawSub.billing_period && rawSub.billing_interval) {
        const interval = parseInt(rawSub.billing_interval);
        const period = rawSub.billing_period;

        let frequencyText = "";
        if (interval === 1) {
          frequencyText = `1 ${period}`;
        } else {
          frequencyText = `${interval} ${period}s`;
        }
        setLocalShippingFrequency(frequencyText);
      }

      // Extract shipping address
      const shipping = rawSub.shipping || rawSub.billing || {};
      // Filter out "[deleted]" values
      const cleanAddress1 =
        shipping.address_1 && shipping.address_1 !== "[deleted]"
          ? shipping.address_1
          : "";

      if (cleanAddress1) {
        const addressParts = [
          cleanAddress1,
          shipping.address_2 && shipping.address_2 !== "[deleted]"
            ? shipping.address_2
            : "",
          shipping.city && shipping.city !== "[deleted]" ? shipping.city : "",
          shipping.state && shipping.state !== "[deleted]"
            ? shipping.state
            : "",
          shipping.postcode && shipping.postcode !== "[deleted]"
            ? shipping.postcode
            : "",
        ].filter(Boolean);
        setLocalShippingAddress(addressParts.join(", "));

        // Also set shipping data for the modal
        setShippingData({
          id: null,
          shipping_address_id: null,
          first_name:
            shipping.first_name && shipping.first_name !== "[deleted]"
              ? shipping.first_name
              : "",
          last_name:
            shipping.last_name && shipping.last_name !== "[deleted]"
              ? shipping.last_name
              : "",
          email:
            (shipping.email && shipping.email !== "[deleted]"
              ? shipping.email
              : "") ||
            (rawSub.billing?.email && rawSub.billing.email !== "[deleted]"
              ? rawSub.billing.email
              : "") ||
            "",
          address_1: cleanAddress1,
          address_2:
            shipping.address_2 && shipping.address_2 !== "[deleted]"
              ? shipping.address_2
              : "",
          city:
            shipping.city && shipping.city !== "[deleted]" ? shipping.city : "",
          postcode:
            shipping.postcode && shipping.postcode !== "[deleted]"
              ? shipping.postcode
              : "",
          country:
            shipping.country && shipping.country !== "[deleted]"
              ? shipping.country
              : "CA",
          state:
            shipping.state && shipping.state !== "[deleted]"
              ? shipping.state
              : "",
        });
      }

      // Extract payment method
      if (rawSub.payment_method_title) {
        setDisplayPaymentMethod(rawSub.payment_method_title);
      } else if (rawSub.payment_method) {
        setDisplayPaymentMethod(rawSub.payment_method);
      }
    } else {
      // Fallback to mapped subscription data if _raw is not available (dummy data)
      if (subscription?.quantity) {
        setLocalQuantity(subscription.quantity);
      } else {
        setLocalQuantity("Not available");
      }
      if (subscription?.shippingFrequency) {
        setLocalShippingFrequency(subscription.shippingFrequency);
      } else {
        setLocalShippingFrequency("Not available");
      }
      if (subscription?.shippingAddress) {
        setLocalShippingAddress(subscription.shippingAddress);
      } else {
        setLocalShippingAddress("Not available");
      }
      if (subscription?.paymentMethod) {
        // Payment method is already formatted (e.g., "**** **** **** 3344")
        setDisplayPaymentMethod(subscription.paymentMethod);
      } else {
        setDisplayPaymentMethod("Not available");
      }
    }
  }, [subscription]);

  // Fetch shipping data when modal opens (if not already set from subscription)
  useEffect(() => {
    if (isShippingAddressModalOpen && !shippingData) {
      const fetchShippingData = async () => {
        try {
          const response = await fetch(`/api/user/billing-shipping`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.user) {
              const userData = data.data.user;
              const shipping = userData.shipping || {};

              // Format shipping data for the modal
              const formattedShippingData = {
                id: shipping.id || null,
                shipping_address_id: shipping.id || null,
                first_name: shipping.first_name || userData.first_name || "",
                last_name: shipping.last_name || userData.last_name || "",
                email: shipping.email || userData.email || "",
                address_1: shipping.address_1 || "",
                address_2: shipping.address_2 || "",
                city: shipping.city || "",
                postcode: shipping.postcode || "",
                country: shipping.country || "CA",
                state: shipping.state || "",
              };

              setShippingData(formattedShippingData);
            }
          }
        } catch (error) {
          console.error("Error fetching shipping data:", error);
        }
      };

      fetchShippingData();
    }
  }, [isShippingAddressModalOpen, shippingData]);

  const {
    productName,
    productSubtitle,
    productImage,
    nextRefill,
    dosage,
    status,
    category,
  } = subscription || {};

  const quantityText = localQuantity;
  const shippingFrequencyText = localShippingFrequency;
  const shippingAddress = localShippingAddress;
  const treatmentInstructions =
    subscription?.treatmentInstructions ||
    "Take 1 tablet by mouth as needed 2 hours before sex. Do not take more than 1 tablet daily.";

  // If we're in a flow step, render the step renderer
  if (stepIndex !== null) {
    return (
      <div className="w-full md:w-[528px] mx-auto">
        <SubscriptionStepRenderer
          stepIndex={flowState.stepIndex}
          subscription={subscription}
          answers={flowState.answers}
          addAnswer={flowState.addAnswer}
          setAnswers={flowState.setAnswers}
          handleContinue={flowState.handleContinue}
          handleBack={flowState.handleBack}
          handleNavigate={flowState.handleNavigate}
          submitCurrentStepData={flowState.submitCurrentStepData}
          submitFormData={flowState.submitFormData}
          onComplete={(data) => {
            // Handle flow completion if needed
            console.log("Flow completed with data:", data);
            // Log all answers saved in object format
            console.log("All answers (object format):", flowState.answers);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full md:w-[528px] mx-auto">
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
              <span className="font-medium">
                {nextRefill || "Oct 15, 2025"}
              </span>
            </div>
          </div>

          {/* Two action tiles */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <CustomButton
              variant="rounded"
              width="full"
              justify="start"
              className="text-left border border-[#E5E7EB] p-4 hover:bg-[#F9FAFB] h-auto cursor-pointer"
              onClick={() => setIsGetRefillModalOpen(true)}
            >
              <div className="flex flex-col">
                <div className="text-[22px] mb-2">
                  <FaArrowsRotate size={16} />
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
              className="text-left border border-[#E5E7EB] p-4 hover:bg-[#F9FAFB] h-auto cursor-pointer"
              onClick={() => setIsChangeRefillDateModalOpen(true)}
            >
              <div className="flex flex-col">
                <div className="text-[22px] mb-2">
                  <FaRegCalendar size={16} />
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
                <div className="flex-1">
                  <div className="text-[16px] font-medium">
                    Quantity & frequency
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-sm text-[#5E5E5E]">{quantityText}</div>
                    {subscription?.status && (
                      <StatusBadge status={subscription.status} />
                    )}
                  </div>
                </div>
                <CustomButton
                  width="fit"
                  size="small"
                  variant="rounded"
                  className="text-[14px] font-medium text-[#111827] underline h-auto p-0"
                  onClick={() => setIsQuantityModalOpen(true)}
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
                <div className="text-sm text-[#5E5E5E] mt-1 whitespace-pre-line max-w-[230px]">
                  {shippingAddress}
                </div>
              </div>
              <CustomButton
                width="fit"
                size="small"
                variant="rounded"
                className="text-[14px] font-medium text-[#111827] underline h-auto p-0"
                onClick={() => setIsShippingAddressModalOpen(true)}
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
                <div className="text-sm text-[#5E5E5E] mt-1">
                  {displayPaymentMethod}
                </div>
              </div>
              <CustomButton
                width="fit"
                size="small"
                variant="rounded"
                className="text-[14px] font-medium text-[#111827] underline h-auto p-0"
                onClick={() => setIsPaymentMethodModalOpen(true)}
              >
                Edit
              </CustomButton>
            </div>
          </section>
        </div>

        {/* Treatment Plan block under card */}
        <section>
          <h3 className="text-[20px] font-semibold mb-4">Treatment Plan</h3>
          <Link href="/prescriptions" className="block">
            <div className="bg-white rounded-[12px] border border-[#E5E7EB] shadow-sm p-4 hover:bg-[#F9FAFB] transition-colors cursor-pointer">
              <div className="text-xs text-[#5E5E5E] mb-1">How to take</div>
              <div className="flex items-center justify-between pt-2">
                <div className="text-[16px] font-medium">View prescription</div>
                <FaArrowRight size={18} />
              </div>
            </div>
          </Link>
        </section>

        {/* Get help block under card */}
        <section>
          <h3 className="text-[20px] font-semibold mb-4 ">Get help</h3>
          <div className="bg-white rounded-[12px] border border-[#E5E7EB] shadow-sm divide-y divide-[#E2E2E1] p-5">
            <button className="w-full text-left hover:bg-[#F9FAFB] h-auto p-0 cursor-pointer transition-colors">
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
              onClick={() => handleNavigate("cancelReasonText")}
              className="w-full text-left hover:bg-[#F9FAFB] h-auto p-0 mt-4 cursor-pointer transition-colors"
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
              onClick={() => handleNavigate("pauseCancel")}
              className="w-full text-left hover:bg-[#F9FAFB] h-auto p-0 mt-4 cursor-pointer transition-colors"
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
              onClick={() => handleNavigate("pauseCancel")}
              className="w-full text-left hover:bg-[#F9FAFB] h-auto p-0 mt-4 cursor-pointer transition-colors"
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

        {/* Update Modals */}
        <QuantityFrequencyModal
          isOpen={isQuantityModalOpen}
          onClose={() => setIsQuantityModalOpen(false)}
          currentValue={localQuantity}
          onSave={(data) => {
            setLocalQuantity(data.quantityFrequency);
            // Handle provider message if needed
            console.log("Provider message:", data.providerMessage);
          }}
        />
        <UpdateModal
          isOpen={isShippingFrequencyModalOpen}
          onClose={() => setIsShippingFrequencyModalOpen(false)}
          title="Adjust Shipping Frequency"
          label="Shipping Frequency"
          currentValue={localShippingFrequency}
          onSave={(value) => setLocalShippingFrequency(value)}
          placeholder="Enter shipping frequency"
        />
        <ShippingAddressModal
          isOpen={isShippingAddressModalOpen}
          onClose={() => setIsShippingAddressModalOpen(false)}
          onSave={async (updatedData) => {
            try {
              // Update shipping address via API
              const response = await fetch("/api/user/shipping-address", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedData),
              });

              const result = await response.json();

              if (result.success) {
                // Update display address
                const addressParts = [
                  updatedData.address_1,
                  updatedData.address_2,
                  updatedData.city,
                  updatedData.state,
                  updatedData.postcode,
                ].filter(Boolean);
                setLocalShippingAddress(addressParts.join(", "));
                toast.success("Shipping address updated successfully");
              } else {
                toast.error(
                  result.error || "Failed to update shipping address"
                );
              }
            } catch (error) {
              console.error("Error updating shipping address:", error);
              toast.error("Failed to update shipping address");
            }
          }}
          shippingData={shippingData}
        />
        <UpdateModal
          isOpen={isPaymentMethodModalOpen}
          onClose={() => setIsPaymentMethodModalOpen(false)}
          title="Update Payment Method"
          label="Payment Method"
          currentValue={localPaymentMethod}
          onSave={(value) => {
            setLocalPaymentMethod(value);
            // Format card number for display (show last 4 digits)
            const last4 = value.cardNumber.replace(/\s/g, "").slice(-4);
            setDisplayPaymentMethod(`•••• •••• •••• ${last4}`);
            toast.success("Payment method updated successfully");
          }}
          isPaymentMethodField={true}
        />
        <GetRefillModal
          isOpen={isGetRefillModalOpen}
          onClose={() => setIsGetRefillModalOpen(false)}
          onConfirm={() => {
            // Handle refill confirmation
            console.log("Refill confirmed");
            toast.success("Refill order has been placed successfully");
          }}
        />
        <ChangeRefillDateModal
          isOpen={isChangeRefillDateModalOpen}
          onClose={() => setIsChangeRefillDateModalOpen(false)}
          currentRefillDate={nextRefill}
          onSave={(newDate) => {
            // Update the refill date
            console.log("New refill date:", newDate);
            toast.success("Refill date updated successfully");
            // You can update the subscription's nextRefill here if needed
          }}
        />
      </Section>
    </div>
  );
}
