"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ProfileField from "../profile/ProfileField";
import ShippingAddressModal from "./ShippingAddressModal";
import UpdateModal from "../utils/UpdateModal";
import {
  initialBillingShippingData,
  billingShippingFields,
} from "./billingShippingData";
import { useUser } from "@/contexts/UserContext";

export default function BillingShippingManager() {
  const [billingShippingData, setBillingShippingData] = useState(
    initialBillingShippingData
  );
  const [shippingData, setShippingData] = useState(null);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [paymentModalState, setPaymentModalState] = useState({
    isOpen: false,
    field: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Log component mount and initial state
  useEffect(() => {
    console.log("[BILLING_SHIPPING] Component mounted");
    console.log(
      "[BILLING_SHIPPING] Initial billing shipping data:",
      billingShippingData
    );
    console.log(
      "[BILLING_SHIPPING] Current shipping address:",
      billingShippingData.shippingAddress
    );
  }, []);

  // Log when shipping address changes
  useEffect(() => {
    console.log(
      "[BILLING_SHIPPING] Shipping address updated:",
      billingShippingData.shippingAddress
    );
  }, [billingShippingData.shippingAddress]);

  // Fetch billing and shipping data from API
  useEffect(() => {
    const fetchBillingShippingData = async () => {
      try {
        console.log("[BILLING_SHIPPING] Fetching billing and shipping data");
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/user/billing-shipping`);

        if (!response.ok) {
          let errorData = {};
          try {
            const responseText = await response.text();
            if (responseText) {
              errorData = JSON.parse(responseText);
            }
          } catch (e) {
            console.error("[BILLING_SHIPPING] Failed to parse error response:", e);
          }
          
          const errorMessage =
            errorData.error ||
            errorData.details ||
            `Failed to fetch billing and shipping data (${response.status})`;
          console.error(
            "[BILLING_SHIPPING] Failed to fetch billing and shipping data:",
            errorMessage,
            errorData
          );
          setError(errorMessage);
          setShippingData(null);
          setBillingShippingData((prev) => ({
            ...prev,
            shippingAddress: "Error loading address",
            paymentMethod: "Error loading payment method",
          }));
          return;
        }

        const data = await response.json();
        console.log("[BILLING_SHIPPING] Billing and shipping response:", data);

        if (data.success && data.data && data.data.user) {
          const userData = data.data.user;
          const shipping = userData.shipping || {};
          const billing = userData.billing || {};
          const paymentProfiles = userData.payment_profile || [];

          console.log("[BILLING_SHIPPING] Extracted shipping data:", shipping);
          console.log("[BILLING_SHIPPING] Extracted billing data:", billing);
          console.log("[BILLING_SHIPPING] Extracted payment profiles:", paymentProfiles);

          // Enhance shipping data with user data if missing
          const enhancedShippingData = {
            ...shipping,
            // Use user email if shipping email is null/empty
            email: shipping.email || userData.email || "",
            // Use user first_name if shipping first_name is empty
            first_name: shipping.first_name || userData.first_name || "",
            // Use user last_name if shipping last_name is empty
            last_name: shipping.last_name || userData.last_name || "",
          };

          // Store enhanced shipping data
          setShippingData(enhancedShippingData);

          // Display shipping address
          const displayAddress = shipping.address_1 || "No address set";
          console.log("[BILLING_SHIPPING] Display address:", displayAddress);

          // Display payment method (use first payment profile if available)
          let displayPaymentMethod = "No payment method";
          if (paymentProfiles.length > 0) {
            const primaryPayment = paymentProfiles[0];
            const cardType = primaryPayment.card_type || "CARD";
            const last4 = primaryPayment.last_4_digits || "****";
            displayPaymentMethod = `${cardType} (**** ${last4})`;
          }

          setBillingShippingData((prev) => ({
            ...prev,
            shippingAddress: displayAddress,
            paymentMethod: displayPaymentMethod,
          }));
          setError(null); // Clear any previous errors on success
        } else {
          // Handle case where response is not successful or data structure is unexpected
          const errorMessage =
            data.error || "Invalid response format from server";
          console.error(
            "[BILLING_SHIPPING] Invalid response format:",
            errorMessage
          );
          setError(errorMessage);
          setShippingData(null);
        }
      } catch (error) {
        console.error(
          "[BILLING_SHIPPING] Error fetching billing and shipping data:",
          error
        );
        const errorMessage =
          error.message ||
          "An unexpected error occurred while fetching data";
        setError(errorMessage);
        setShippingData(null);
        setBillingShippingData((prev) => ({
          ...prev,
          shippingAddress: "Error loading address",
          paymentMethod: "Error loading payment method",
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchBillingShippingData();
  }, []);

  const handleUpdateClick = (field) => {
    console.log("[BILLING_SHIPPING] Update clicked for field:", field.key);

    if (field.key === "shippingAddress") {
      setIsShippingModalOpen(true);
    } else if (field.key === "paymentMethod") {
      setPaymentModalState({
        isOpen: true,
        field: field,
      });
    }
  };

  const handleSavePaymentMethod = async (paymentData) => {
    console.log("[BILLING_SHIPPING] Saving payment method:", paymentData);

    try {
      setError(null);
      // TODO: Replace with actual API endpoint when available
      const response = await fetch(`/api/user/payment-method`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          `Failed to update payment method (${response.status})`;
        console.error(
          "[BILLING_SHIPPING] Failed to update payment method:",
          errorMessage
        );
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
        });
        setError(errorMessage);
        return;
      }

      const data = await response.json();
      console.log(
        "[BILLING_SHIPPING] Payment method updated successfully:",
        data
      );

      if (!data.success) {
        const errorMessage = data.error || "Failed to update payment method";
        console.error(
          "[BILLING_SHIPPING] Update was not successful:",
          errorMessage
        );
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
        });
        setError(errorMessage);
        return;
      }

      // Update local state - format as "VISA (**** 1234)" or similar
      const last4 = paymentData.cardNumber?.slice(-4) || "****";
      const displayValue = `VISA (**** ${last4})`;
      setBillingShippingData((prev) => ({
        ...prev,
        paymentMethod: displayValue,
      }));
      setError(null);
      toast.success("Payment method updated successfully", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error(
        "[BILLING_SHIPPING] Error updating payment method:",
        error
      );
      const errorMessage =
        error.message || "An unexpected error occurred while updating payment method";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
      setError(errorMessage);
    }
  };

  const handleClosePaymentModal = () => {
    setPaymentModalState({
      isOpen: false,
      field: null,
    });
  };

  const handleSaveShippingAddress = async (formData) => {
    console.log("[BILLING_SHIPPING] Saving shipping address:", formData);

    try {
      console.log("[BILLING_SHIPPING] Updating shipping address in CRM");
      setError(null); // Clear any previous errors
      const response = await fetch(`/api/user/shipping-address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          `Failed to update shipping address (${response.status})`;
        console.error(
          "[BILLING_SHIPPING] Failed to update shipping address:",
          errorMessage
        );
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
        });
        return;
      }

      const data = await response.json();
      console.log(
        "[BILLING_SHIPPING] Shipping address updated successfully:",
        data
      );

      // Check if the response indicates success
      if (!data.success) {
        const errorMessage = data.error || "Failed to update shipping address";
        console.error(
          "[BILLING_SHIPPING] Update was not successful:",
          errorMessage
        );
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
        });
        return;
      }

      // Update local state with new shipping data
      setShippingData(formData);

      // Update display address
      const displayAddress = formData.address_1 || "No address set";
      setBillingShippingData((prev) => ({
        ...prev,
        shippingAddress: displayAddress,
      }));
      setError(null); // Clear any previous errors on success
      toast.success("Shipping address updated successfully", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error(
        "[BILLING_SHIPPING] Error updating shipping address:",
        error
      );
      const errorMessage =
        error.message || "An unexpected error occurred while updating address";
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {billingShippingFields.map((field) => (
          <ProfileField
            key={field.key}
            label={field.label}
            value={billingShippingData[field.key]}
            onUpdate={() => handleUpdateClick(field)}
          />
        ))}
      </div>

      {/* Shipping Address Modal */}
      {isShippingModalOpen && (
        <ShippingAddressModal
          isOpen={isShippingModalOpen}
          onClose={() => setIsShippingModalOpen(false)}
          onSave={handleSaveShippingAddress}
          shippingData={shippingData}
        />
      )}

      {/* Payment Method Modal */}
      {paymentModalState.isOpen && paymentModalState.field && (
        <UpdateModal
          key={paymentModalState.field.key}
          isOpen={paymentModalState.isOpen}
          onClose={handleClosePaymentModal}
          onSave={handleSavePaymentMethod}
          title="Update Payment Method"
          label={paymentModalState.field.label}
          currentValue={billingShippingData[paymentModalState.field.key]}
          isPaymentMethodField={true}
        />
      )}
    </>
  );
}
