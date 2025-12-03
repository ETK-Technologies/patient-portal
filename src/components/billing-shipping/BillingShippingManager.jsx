"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ProfileField from "../profile/ProfileField";
import ShippingAddressModal from "./ShippingAddressModal";
import BillingAddressModal from "./BillingAddressModal";
import UpdateModal from "../utils/UpdateModal";
import {
  initialBillingShippingData,
  billingShippingFields,
} from "./billingShippingData";
import { useUser } from "@/contexts/UserContext";

export default function BillingShippingManager() {
  const { userData, loading: userLoading } = useUser();
  const [billingShippingData, setBillingShippingData] = useState(
    initialBillingShippingData
  );
  const [shippingData, setShippingData] = useState(null);
  const [billingData, setBillingData] = useState(null);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [paymentModalState, setPaymentModalState] = useState({
    isOpen: false,
    field: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const fetchBillingShippingData = async () => {
      let userId = getUserIdFromCookies();

      if (!userId && !userLoading && userData) {
        if (userData.crm_user_id) {
          userId = userData.crm_user_id;
        }
      }

      if (!userId && userLoading) {
        return;
      }

      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [addressResponse, paymentResponse] = await Promise.all([
          fetch(`/api/user/${userId}/address`),
          fetch(`/api/user/${userId}/payment/profiles`),
        ]);

        let shipping = {};
        let billing = {};
        let displayShippingAddress = "No address set";
        let displayBillingAddress = "No address set";

        if (addressResponse.ok) {
          const addressResult = await addressResponse.json();
          if (addressResult.success && addressResult.data) {
            const responseData = addressResult.data;
            const shippingAddress = responseData.shipping_address || {};
            const billingAddress = responseData.billing_address || {};

            if (shippingAddress) {
              shipping = shippingAddress;
              setShippingData(shipping);

              const addressParts = [
                shipping.address_1,
                shipping.address_2,
                shipping.city,
                shipping.postcode,
              ].filter(Boolean);

              displayShippingAddress =
                addressParts.length > 0
                  ? addressParts.join(", ")
                  : "No address set";
            }

            if (billingAddress) {
              billing = billingAddress;
              setBillingData(billing);

              const addressParts = [
                billing.address_1,
                billing.address_2,
                billing.city,
                billing.postcode,
              ].filter(Boolean);

              displayBillingAddress =
                addressParts.length > 0
                  ? addressParts.join(", ")
                  : "No address set";
            } else if (shippingAddress) {
              // Fallback: use shipping address as billing address if billing is not set
              billing = shippingAddress;
              setBillingData(billing);
              displayBillingAddress = displayShippingAddress;
            }
          }
        }

        let displayPaymentMethod = "No payment method";

        if (paymentResponse.ok) {
          const paymentResult = await paymentResponse.json();
          if (paymentResult.success && paymentResult.data) {
            const paymentData = paymentResult.data;
            const profiles = paymentData.profiles || [];

            if (profiles.length > 0) {
              const primaryPayment = profiles[0];
              const last4Digits = primaryPayment.last_4_digits || "";

              if (last4Digits) {
                const cleanLast4 = last4Digits.replace(/[^0-9]/g, "").slice(-4);
                if (cleanLast4.length === 4) {
                  displayPaymentMethod = `**** **** **** ${cleanLast4}`;
                }
              }
            }
          }
        }

        if (!addressResponse.ok && !paymentResponse.ok) {
          const addressError = await addressResponse.json().catch(() => ({}));
          const paymentError = await paymentResponse.json().catch(() => ({}));
          const errorMessage =
            addressError.error ||
            paymentError.error ||
            "Failed to fetch billing and shipping data";
          setError(errorMessage);
          setShippingData(null);
          setBillingData(null);
          setBillingShippingData((prev) => ({
            ...prev,
            billingAddress: "Error loading address",
            shippingAddress: "Error loading address",
            paymentMethod: "Error loading payment method",
          }));
          return;
        }

        setBillingShippingData((prev) => ({
          ...prev,
          billingAddress: displayBillingAddress,
          shippingAddress: displayShippingAddress,
          paymentMethod: displayPaymentMethod,
        }));
        setError(null);
      } catch (error) {
        console.error(
          "[BILLING_SHIPPING] Error fetching billing and shipping data:",
          error
        );
        const errorMessage =
          error.message || "An unexpected error occurred while fetching data";
        setError(errorMessage);
        setShippingData(null);
        setBillingData(null);
        setBillingShippingData((prev) => ({
          ...prev,
          billingAddress: "Error loading address",
          shippingAddress: "Error loading address",
          paymentMethod: "Error loading payment method",
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchBillingShippingData();
  }, [userData, userLoading]);

  const handleUpdateClick = (field) => {
    if (field.key === "shippingAddress") {
      setIsShippingModalOpen(true);
    } else if (field.key === "billingAddress") {
      setIsBillingModalOpen(true);
    } else if (field.key === "paymentMethod") {
      setPaymentModalState({
        isOpen: true,
        field: field,
      });
    }
  };

  const handleSavePaymentMethod = async (paymentData) => {
    try {
      setError(null);
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
        toast.error(errorMessage);
        setError(errorMessage);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        const errorMessage = data.error || "Failed to update payment method";
        toast.error(errorMessage);
        setError(errorMessage);
        return;
      }

      const last4 = paymentData.cardNumber?.slice(-4) || "****";
      const displayValue = `VISA (**** ${last4})`;
      setBillingShippingData((prev) => ({
        ...prev,
        paymentMethod: displayValue,
      }));
      setError(null);
      toast.success("Payment method updated successfully");
    } catch (error) {
      console.error("[BILLING_SHIPPING] Error updating payment method:", error);
      const errorMessage =
        error.message ||
        "An unexpected error occurred while updating payment method";
      toast.error(errorMessage);
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
    try {
      setError(null);

      let userId = getUserIdFromCookies();
      if (!userId && userData) {
        if (userData.crm_user_id) {
          userId = userData.crm_user_id;
        }
      }

      if (!userId) {
        const errorMessage = "User ID not available";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const existingShipping = shippingData || {};
      const mergedData = {
        ...existingShipping,
        ...formData,
      };

      const requestBody = {
        id: String(userId),
        shipping_first_name: mergedData.first_name || "",
        shipping_last_name: mergedData.last_name || "",
        shipping_email: mergedData.email || "",
        shipping_country: mergedData.country || "",
        shipping_address_1: mergedData.address_1 || "",
        shipping_address_2: mergedData.address_2 || "",
        shipping_city: mergedData.city || "",
        shipping_state: mergedData.state || "",
        shipping_postcode: mergedData.postcode || "",
      };

      const response = await fetch(`/api/user/shipping/address/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          `Failed to update shipping address (${response.status})`;
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        const errorMessage = data.error || "Failed to update shipping address";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      setShippingData(mergedData);

      const addressParts = [
        mergedData.address_1,
        mergedData.address_2,
        mergedData.city,
        mergedData.postcode,
      ].filter(Boolean);

      const displayAddress =
        addressParts.length > 0 ? addressParts.join(", ") : "No address set";

      setBillingShippingData((prev) => ({
        ...prev,
        shippingAddress: displayAddress,
      }));
      setError(null);
      toast.success("Shipping address updated successfully");
    } catch (error) {
      console.error(
        "[BILLING_SHIPPING] Error updating shipping address:",
        error
      );
      const errorMessage =
        error.message || "An unexpected error occurred while updating address";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleSaveBillingAddress = async (formData) => {
    try {
      setError(null);

      let userId = getUserIdFromCookies();
      if (!userId && userData) {
        if (userData.crm_user_id) {
          userId = userData.crm_user_id;
        }
      }

      if (!userId) {
        const errorMessage = "User ID not available";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const existingBilling = billingData || {};
      const mergedData = {
        ...existingBilling,
        ...formData,
      };

      const requestBody = {
        id: String(userId),
        billing_first_name: mergedData.first_name || "",
        billing_last_name: mergedData.last_name || "",
        billing_email: mergedData.email || "",
        billing_phone: mergedData.phone || "",
        billing_country: mergedData.country || "",
        billing_address_1: mergedData.address_1 || "",
        billing_address_2: mergedData.address_2 || "",
        billing_city: mergedData.city || "",
        billing_state: mergedData.state || "",
        billing_postcode: mergedData.postcode || "",
      };

      const response = await fetch(`/api/user/billing/address/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          `Failed to update billing address (${response.status})`;
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        const errorMessage = data.error || "Failed to update billing address";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      setBillingData(mergedData);

      const addressParts = [
        mergedData.address_1,
        mergedData.address_2,
        mergedData.city,
        mergedData.postcode,
      ].filter(Boolean);

      const displayAddress =
        addressParts.length > 0 ? addressParts.join(", ") : "No address set";

      setBillingShippingData((prev) => ({
        ...prev,
        billingAddress: displayAddress,
      }));
      setError(null);
      toast.success("Billing address updated successfully");
    } catch (error) {
      console.error(
        "[BILLING_SHIPPING] Error updating billing address:",
        error
      );
      const errorMessage =
        error.message || "An unexpected error occurred while updating address";
      setError(errorMessage);
      toast.error(errorMessage);
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

      {isShippingModalOpen && (
        <ShippingAddressModal
          isOpen={isShippingModalOpen}
          onClose={() => setIsShippingModalOpen(false)}
          onSave={handleSaveShippingAddress}
          shippingData={shippingData}
        />
      )}

      {isBillingModalOpen && (
        <BillingAddressModal
          isOpen={isBillingModalOpen}
          onClose={() => setIsBillingModalOpen(false)}
          onSave={handleSaveBillingAddress}
          billingData={billingData}
          shippingData={shippingData}
        />
      )}

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
