"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  onCloseFlow,
}) {
  const router = useRouter();
  const [subscriptionDetails, setSubscriptionDetails] = useState(subscription);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Initialize flow state - start at null (main view) unless action indicates otherwise
  const initialStep = action === "Manage subscription" ? null : null;
  const currentSubscriptionForFlow = subscriptionDetails || subscription;
  const flowState = useSubscriptionFlow(currentSubscriptionForFlow, initialStep);
  const { stepIndex, handleNavigate, handleBack } = flowState;
  const [isChattingProvider, setIsChattingProvider] = useState(false);

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
    const currentSub = subscriptionDetails || subscription;
    if (currentSub?._raw) {
      const rawSub = currentSub._raw;
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

    return {
      quantity: currentSub?.quantity || "Not available",
      shippingFreq: currentSub?.shippingFrequency || "Not available",
      shippingAddr: currentSub?.shippingAddress || "Not available",
      shippingDataObj: null,
      paymentMethod: currentSub?.paymentMethod || "Not available",
    };
  };

  // Helper to get initial values - will be recalculated when subscription changes
  const getInitialValuesForState = () => {
    const currentSub = subscriptionDetails || subscription;
    if (currentSub?._raw) {
      const rawSub = currentSub._raw;
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

    return {
      quantity: currentSub?.quantity || "Not available",
      shippingFreq: currentSub?.shippingFrequency || "Not available",
      shippingAddr: currentSub?.shippingAddress || "Not available",
      paymentMethod: currentSub?.paymentMethod || "Not available",
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
  const { userData, refreshSubscriptions } = useUser();
  const [isRequestingRefill, setIsRequestingRefill] = useState(false);
  const [isChangingRefillDate, setIsChangingRefillDate] = useState(false);

  const handleChatWithProvider = async () => {
    const currentSub = subscriptionDetails || subscription;
    
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
      return;
    }

    const prescriptionCrmUserId = currentSub?._raw?.prescription?.crm_user_id;
    
    if (!prescriptionCrmUserId) {
      toast.error("Provider information not found for this subscription");
      return;
    }

    setIsChattingProvider(true);
    try {
      const participantIds = `${prescriptionCrmUserId},${userId}`;
      
      const response = await fetch(
        `/api/messenger/threads/search-by-participants?participantIds=${participantIds}`,
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
        throw new Error(errorData.error || "Failed to search for thread");
      }

      const data = await response.json();

      if (data.success && data.chatUrl) {
        window.open(data.chatUrl, "_blank", "noopener,noreferrer");
        toast.success("Opening chat with provider...");
      } else {
        throw new Error(data.error || "Failed to get chat URL");
      }
    } catch (error) {
      console.error("Error chatting with provider:", error);
      toast.error(error.message || "Failed to connect with provider. Please try again.");
    } finally {
      setIsChattingProvider(false);
    }
  };

  const mapSubscriptionData = (subscriptionData, subscriptionId, existingSubscription = subscription) => {
    const firstLineItem = subscriptionData.line_items?.[0] || {};
    
    const tabsFrequency = firstLineItem.tabs_frequency || "";
    const subscriptionType = firstLineItem.subscription_type || "";
    const dosage =
      tabsFrequency && subscriptionType
        ? `${tabsFrequency} | ${subscriptionType}`
        : tabsFrequency || subscriptionType || existingSubscription.dosage || "Not available";

    const quantity = firstLineItem.quantity || 1;
    const billingPeriod = subscriptionData.billing_period || "";
    const billingInterval = subscriptionData.billing_interval || "";
    let quantityFrequency = existingSubscription.quantity || "Not available";
    if (tabsFrequency) {
      quantityFrequency = `${tabsFrequency} / month`;
    } else if (billingPeriod && billingInterval) {
      const interval = parseInt(billingInterval);
      quantityFrequency = `${quantity} ${quantity === 1 ? "item" : "items"} / ${interval === 1 ? billingPeriod : `${interval} ${billingPeriod}s`}`;
    }

    const shipping = subscriptionData.shipping || {};
    let shippingAddress = "Not available";
    if (shipping.address_1) {
      const addressParts = [
        shipping.address_1,
        shipping.address_2,
        shipping.city,
        shipping.state,
        shipping.postcode,
      ].filter(Boolean);
      shippingAddress = addressParts.join(", ");
    }

    const paymentData = subscriptionData.payment_data || {};
    let paymentMethod = "Not available";
    if (paymentData.card_number) {
      const last4 = paymentData.card_number.replace(/X/g, "").slice(-4);
      paymentMethod = `•••• •••• •••• ${last4}`;
    } else if (paymentData.card_type) {
      paymentMethod = paymentData.card_type;
    }

    return {
      id: subscriptionData.id || subscriptionId,
      category: firstLineItem.category_name || "Sexual Health",
      status: subscriptionData.status?.toLowerCase() || existingSubscription.status,
      productName: firstLineItem.product_name || existingSubscription.productName,
      productSubtitle: existingSubscription.productSubtitle || firstLineItem.brand || "",
      dosage: dosage,
      nextRefill: subscriptionData.next_refill || existingSubscription.nextRefill,
      productImage: firstLineItem.product_image || existingSubscription.productImage,
      quantity: quantityFrequency,
      shippingFrequency: billingPeriod && billingInterval 
        ? (parseInt(billingInterval) === 1 ? `1 ${billingPeriod}` : `${billingInterval} ${billingPeriod}s`)
        : existingSubscription.shippingFrequency || "Not available",
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod,
      _raw: subscriptionData,
    };
  };

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (action === "Manage subscription" && subscription?.id) {
        setIsLoadingDetails(true);
        try {
          const subscriptionId = subscription.id || subscription._raw?.id;
          
          if (!subscriptionId) {
            console.warn("[SubscriptionFlow] No subscription ID found, using existing data");
            setIsLoadingDetails(false);
            return;
          }

          const response = await fetch(`/api/user/subscription/${subscriptionId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          const result = await response.json();

          if (response.ok && result.success && result.data) {
            const subscriptionData = result.data?.subscription || result.data;
            
            if (!subscriptionData) {
              console.warn("[SubscriptionFlow] No subscription data in response, using existing data");
              setIsLoadingDetails(false);
              return;
            }

            const mappedSubscription = mapSubscriptionData(subscriptionData, subscriptionId, subscription);
            setSubscriptionDetails(mappedSubscription);
          } else {
            console.warn("[SubscriptionFlow] Failed to fetch subscription details, using existing data");
           }
        } catch (error) {
          console.error("[SubscriptionFlow] Error fetching subscription details:", error);
          } finally {
          setIsLoadingDetails(false);
        }
      }
    };

    fetchSubscriptionDetails();
  }, [action, subscription?.id]);

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
    const currentSubscription = subscriptionDetails || subscription;
    if (currentSubscription?._raw) {
      const rawSub = currentSubscription._raw;

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
      } else {
        setLocalShippingAddress("Not available");
      }

      const paymentData = rawSub.payment_data || {};
      if (paymentData.card_number) {
       const cardNumber = paymentData.card_number.replace(/X/g, "");
        const last4 = cardNumber.slice(-4);
        setDisplayPaymentMethod(`•••• •••• •••• ${last4}`);
      } else if (paymentData.card_type) {
        setDisplayPaymentMethod(paymentData.card_type);
      } else if (rawSub.payment_method_title) {
        setDisplayPaymentMethod(rawSub.payment_method_title);
      } else if (rawSub.payment_method) {
        setDisplayPaymentMethod(rawSub.payment_method);
      } else {
        setDisplayPaymentMethod("Not available");
      }
    } else {
      // Fallback to mapped subscription data if _raw is not available (dummy data)
      if (currentSubscription?.quantity) {
        setLocalQuantity(currentSubscription.quantity);
      } else {
        setLocalQuantity("Not available");
      }
      if (currentSubscription?.shippingFrequency) {
        setLocalShippingFrequency(currentSubscription.shippingFrequency);
      } else {
        setLocalShippingFrequency("Not available");
      }
      if (currentSubscription?.shippingAddress) {
        setLocalShippingAddress(currentSubscription.shippingAddress);
      } else {
        setLocalShippingAddress("Not available");
      }
      if (currentSubscription?.paymentMethod) {
        // Payment method is already formatted (e.g., "**** **** **** 3344")
        setDisplayPaymentMethod(currentSubscription.paymentMethod);
      } else {
        setDisplayPaymentMethod("Not available");
      }
    }
  }, [subscriptionDetails, subscription]);

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

  const currentSubscription = subscriptionDetails || subscription;
  
  const {
    productName,
    productSubtitle,
    productImage,
    nextRefill,
    dosage,
    status,
    category,
  } = currentSubscription || {};

  const quantityText = localQuantity;
  const shippingFrequencyText = localShippingFrequency;
  const shippingAddress = localShippingAddress;
  const treatmentInstructions =
    currentSubscription?.treatmentInstructions ||
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
          initialAction={flowState.initialAction}
          clearLocalStorage={flowState.clearLocalStorage}
          onCloseFlow={onCloseFlow}
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
                  Request refill
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
                    {currentSubscription?.status && (
                      <StatusBadge status={currentSubscription.status} />
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
            <button
              onClick={handleChatWithProvider}
              disabled={isChattingProvider}
              className="w-full text-left hover:bg-[#F9FAFB] h-auto p-0 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-full ">
                <div className="text-xs text-[#5E5E5E] mb-1">
                  Medical questions
                </div>
                <div className="flex items-center justify-between mb-4  ">
                  <div className="text-[16px] font-medium">
                    {isChattingProvider ? "Connecting..." : "Chat with a provider"}
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
              onClick={() => {
                flowState.setInitialAction("skip");
                handleNavigate("pauseInstead");
              }}
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
              onClick={() => {
                flowState.setInitialAction("pauseCancel");
                handleNavigate("pauseCancel");
              }}
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
          onSave={async (data) => {
            try {
              const currentSub = subscriptionDetails || subscription;
              const subscriptionId = currentSub?.id || currentSub?._raw?.id;
              const firstLineItem = currentSub?._raw?.line_items?.[0];
              const lineItemId = firstLineItem?.id;

              if (!subscriptionId) {
                throw new Error("Subscription ID not found");
              }

              if (!lineItemId) {
                throw new Error("Line item ID not found");
              }

             const quantityMatch = data.quantityFrequency.match(/^(\d+)/);
              if (!quantityMatch) {
                throw new Error("Invalid quantity format");
              }
              const quantity = parseInt(quantityMatch[1], 10);

              const response = await fetch(
                `/api/user/subscription/update/quantity/${subscriptionId}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  credentials: "include",
                  body: JSON.stringify({
                    line_item_id: lineItemId,
                    quantity: quantity,
                  }),
                }
              );

              const result = await response.json();

              if (!response.ok || !result.success) {
                throw new Error(
                  result.error || result.message || "Failed to update quantity"
                );
              }

              setLocalQuantity(data.quantityFrequency);
              toast.success("Quantity & frequency updated successfully");

              if (refreshSubscriptions) {
                await refreshSubscriptions();
              }

             if (data.providerMessage) {
                console.log("Provider message:", data.providerMessage);
              }
            } catch (error) {
              console.error("Error updating quantity & frequency:", error);
              toast.error(
                error.message || "Failed to update quantity & frequency"
              );
            }
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
              const currentSub = subscriptionDetails || subscription;
              const subscriptionId = currentSub?.id || currentSub?._raw?.id;

              if (!subscriptionId) {
                throw new Error("Subscription ID not found");
              }

              const response = await fetch("/api/user/update-refill-shipping-address", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                  subscription_id: subscriptionId,
                  shipping_address: {
                    first_name: updatedData.first_name || "",
                    last_name: updatedData.last_name || "",
                    email: updatedData.email || "",
                    address_1: updatedData.address_1 || "",
                    address_2: updatedData.address_2 || "",
                    city: updatedData.city || "",
                    state: updatedData.state || "",
                    postcode: updatedData.postcode || "",
                    country: updatedData.country || "CA",
                  },
                }),
              });

              const result = await response.json();

              if (!response.ok || !result.success) {
                throw new Error(
                  result.error || result.message || "Failed to update shipping address"
                );
              }

              const addressParts = [
                updatedData.address_1,
                updatedData.address_2,
                updatedData.city,
                updatedData.state,
                updatedData.postcode,
              ].filter(Boolean);
              setLocalShippingAddress(addressParts.join(", "));
              toast.success("Shipping address updated successfully");

              if (refreshSubscriptions) {
                await refreshSubscriptions();
              }
            } catch (error) {
              console.error("Error updating shipping address:", error);
              toast.error(error.message || "Failed to update shipping address");
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
          onConfirm={async () => {
            try {
              setIsRequestingRefill(true);
              
              const currentSub = subscriptionDetails || subscription;
              const subscriptionId = currentSub?.id || currentSub?._raw?.id;
              
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
              setIsGetRefillModalOpen(false);
              
              if (refreshSubscriptions) {
                await refreshSubscriptions();
              }
            } catch (error) {
              console.error("Error requesting refill:", error);
              toast.error(error.message || "Failed to request refill");
            } finally {
              setIsRequestingRefill(false);
            }
          }}
        />
        <ChangeRefillDateModal
          isOpen={isChangeRefillDateModalOpen}
          onClose={() => setIsChangeRefillDateModalOpen(false)}
          currentRefillDate={nextRefill}
          onSave={async (apiDateFormat, formattedDate) => {
            try {
              setIsChangingRefillDate(true);
              
              const currentSub = subscriptionDetails || subscription;
              const subscriptionId = currentSub?.id || currentSub?._raw?.id;
              
              if (!subscriptionId) {
                throw new Error("Subscription ID not found");
              }

              if (!apiDateFormat) {
                throw new Error("Refill date is required");
              }

              const response = await fetch("/api/user/change-refill-date", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                  subscription_id: subscriptionId,
                  refill_date: apiDateFormat,
                }),
              });

              const result = await response.json();

              if (!response.ok || !result.success) {
                throw new Error(result.error || result.message || "Failed to change refill date");
              }

              const [subscriptionResponse, refreshResult] = await Promise.all([
                fetch(`/api/user/subscription/${subscriptionId}`, {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  credentials: "include",
                }),
                refreshSubscriptions ? refreshSubscriptions() : Promise.resolve(),
              ]);

              const subscriptionResult = await subscriptionResponse.json();

              if (subscriptionResponse.ok && subscriptionResult.success && subscriptionResult.data) {
                const subscriptionData = subscriptionResult.data?.subscription || subscriptionResult.data;
                
                if (subscriptionData) {
                  const mappedSubscription = mapSubscriptionData(
                    subscriptionData,
                    subscriptionId,
                    currentSub
                  );
                  setSubscriptionDetails(mappedSubscription);
                }
              }

              toast.success("Refill date updated successfully");
              
              setIsChangeRefillDateModalOpen(false);
            } catch (error) {
              console.error("Error changing refill date:", error);
              toast.error(error.message || "Failed to change refill date");
            } finally {
              setIsChangingRefillDate(false);
            }
          }}
        />
      </Section>
    </div>
  );
}
