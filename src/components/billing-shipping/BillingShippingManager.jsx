"use client";

import { useState, useEffect } from "react";
import ProfileField from "../profile/ProfileField";
import ShippingAddressModal from "./ShippingAddressModal";
import {
  initialBillingShippingData,
  billingShippingFields,
} from "./billingShippingData";

export default function BillingShippingManager() {
  const [billingShippingData, setBillingShippingData] = useState(
    initialBillingShippingData
  );
  const [shippingData, setShippingData] = useState(null);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);

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

  // Fetch shipping address from API
  useEffect(() => {
    const fetchShippingAddress = async () => {
      try {
        console.log("[BILLING_SHIPPING] Fetching shipping address");
        const response = await fetch(`/api/user/shipping-address`);

        if (!response.ok) {
          console.error(
            "[BILLING_SHIPPING] Failed to fetch shipping address:",
            response.status
          );
          return;
        }

        const data = await response.json();
        console.log("[BILLING_SHIPPING] Shipping address response:", data);

        if (data.success && data.data) {
          // Extract shipping data from response structure: data.data.user.shipping
          const userData = data.data.user || data.data;
          const shipping = userData.shipping || {};

          console.log("[BILLING_SHIPPING] Extracted shipping data:", shipping);

          // Store full shipping data
          setShippingData(shipping);

          // Display only address_1 for the shipping address field
          const displayAddress = shipping.address_1 || "No address set";
          console.log("[BILLING_SHIPPING] Display address:", displayAddress);

          setBillingShippingData((prev) => ({
            ...prev,
            shippingAddress: displayAddress,
          }));
        }
      } catch (error) {
        console.error(
          "[BILLING_SHIPPING] Error fetching shipping address:",
          error
        );
      }
    };

    fetchShippingAddress();
  }, []);

  const handleUpdateClick = (field) => {
    console.log("[BILLING_SHIPPING] Update clicked for field:", field.key);

    if (field.key === "shippingAddress") {
      setIsShippingModalOpen(true);
    }
  };

  const handleSaveShippingAddress = async (formData) => {
    console.log("[BILLING_SHIPPING] Saving shipping address:", formData);

    try {
      console.log("[BILLING_SHIPPING] Updating shipping address in CRM");
      const response = await fetch(`/api/user/shipping-address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        console.error(
          "[BILLING_SHIPPING] Failed to update shipping address:",
          response.status
        );
        const errorData = await response.json();
        console.error("[BILLING_SHIPPING] Error details:", errorData);
        return;
      }

      const data = await response.json();
      console.log(
        "[BILLING_SHIPPING] Shipping address updated successfully:",
        data
      );

      // Update local state with new shipping data
      setShippingData(formData);

      // Update display address
      const displayAddress = formData.address_1 || "No address set";
      setBillingShippingData((prev) => ({
        ...prev,
        shippingAddress: displayAddress,
      }));
    } catch (error) {
      console.error(
        "[BILLING_SHIPPING] Error updating shipping address:",
        error
      );
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
    </>
  );
}
