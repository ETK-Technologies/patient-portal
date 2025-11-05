"use client";

import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import ProfileField from "./ProfileField";
import UpdateModal from "@/components/utils/UpdateModal";
import { initialProfileData, profileFields } from "./profileData";
import { useUser } from "@/contexts/UserContext";

// Helper function to map CRM data to profile format
// This handles both login response data and profile API response data
function mapUserDataToProfile(userData) {
  if (!userData) return initialProfileData;

  // Extract billing/shipping address if available (from profile API or login response)
  // Login response may have billing_address_id and shipping_address_id, but not the actual address objects
  const billing = userData.billing || {};
  const shipping = userData.shipping || {};

  // Get first and last name from login response or profile API
  const firstName = userData.first_name || "";
  const lastName = userData.last_name || "";

  // Combine first and last name for display, fallback to name if available
  // Login response has 'name' field directly
  const fullName = userData.name || `${firstName} ${lastName}`.trim() || "";

  // Map email from login response or profile API
  const email = userData.email || "";

  // Map date of birth from login response or profile API
  const dateOfBirth = userData.date_of_birth || userData.dob || "";

  // Map phone number from login response or profile API
  const phoneNumber = userData.phone_number || userData.phone || "";

  // Map province from login response (login response has 'province' field directly)
  const province =
    shipping.state ||
    billing.state ||
    userData.province ||
    userData.state ||
    "";

  // Map address fields - login response doesn't have full address, so use from shipping/billing or empty
  const address = shipping.address_1 || billing.address_1 || userData.address || "";
  const city = shipping.city || billing.city || userData.city || "";
  const postalCode =
    shipping.postcode ||
    billing.postcode ||
    userData.postal_code ||
    userData.zip_code ||
    "";

  // Map photo ID and insurance card from login response
  const photoId = userData.photo_id || "";
  const insuranceCard =
    userData.insurance_card_image || userData.insurance_card || "";

  // Map avatar from login response (has 'avatar' and 'profile_photo_url' fields)
  const avatar = userData.avatar || userData.profile_photo_url || "";

  return {
    fullName: fullName,
    email: email,
    dateOfBirth: dateOfBirth,
    phoneNumber: phoneNumber,
    address: address,
    city: city,
    province: province,
    postalCode: postalCode,
    photoId: photoId,
    insuranceCard: insuranceCard,
    // Store first and last name separately for editing
    firstName: firstName,
    lastName: lastName,
    gender: userData.gender || "",
    avatar: avatar,
    // Store additional fields that might be useful
    wp_user_id: userData.wp_user_id || userData.id || "",
  };
}

export default function ProfileManager() {
  const { userData, loading, error, refreshUserData } = useUser();

  // Derive mapped profile data from userData
  const mappedProfileData = useMemo(
    () => mapUserDataToProfile(userData),
    [userData]
  );

  // Local state for edited values (only store fields that have been edited)
  // These persist even when userData refreshes, so user edits aren't lost
  const [editedFields, setEditedFields] = useState({});
  const [modalState, setModalState] = useState({
    isOpen: false,
    field: null,
  });

  // Merge mapped data with edited fields
  const profileData = useMemo(
    () => ({
      ...mappedProfileData,
      ...editedFields,
    }),
    [mappedProfileData, editedFields]
  );

  const handleUpdateClick = (field) => {
    setModalState({
      isOpen: true,
      field: field,
    });
  };

  const handleSave = async (newValue) => {
    const fieldKey = modalState.field.key;

    try {
      // Update user data in CRM via API
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          field: fieldKey,
          value: newValue,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Failed to update profile:", result.error);
        toast.error(
          `Failed to update ${modalState.field.label}: ${result.error || "Unknown error"
          }`,
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
        return;
      }

      // Update local state after successful API call
      if (fieldKey === "fullName" && typeof newValue === "object") {
        // newValue is an object with firstName and lastName
        setEditedFields((prev) => ({
          ...prev,
          firstName: newValue.firstName,
          lastName: newValue.lastName,
          fullName: `${newValue.firstName} ${newValue.lastName}`.trim(),
        }));
      } else {
        // Store edited value
        setEditedFields((prev) => ({
          ...prev,
          [fieldKey]: newValue,
        }));
      }

      // Refresh user data from server to get latest data
      await refreshUserData();

      // Show success message
      toast.success(`${modalState.field.label} updated successfully`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        `Failed to update ${modalState.field.label}: ${error.message}`,
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
    }
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      field: null,
    });
  };

  const getModalProps = () => {
    if (!modalState.field) return {};

    const field = modalState.field;
    const inputTypeMap = {
      email: "email",
      dateOfBirth: "date",
      phoneNumber: "tel",
    };

    const isFileUpload =
      field.key === "photoId" || field.key === "insuranceCard";

    // Special handling for fullName - pass both first and last name
    const isNameField = field.key === "fullName";

    return {
      title: `Update ${field.label}`,
      label: field.label,
      currentValue: isNameField
        ? { firstName: profileData.firstName, lastName: profileData.lastName }
        : profileData[field.key],
      inputType: inputTypeMap[field.key] || "text",
      isFileUpload: isFileUpload,
      isNameField: isNameField,
      placeholder: `Enter your ${field.label.toLowerCase()}`,
    };
  };

  // If we have userData from login, show it even if loading (profile API might be fetching additional data)
  // Only show loading if we have no userData at all
  if (loading && !userData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-[#1F4C73] border-r-transparent"></div>
          <span className="ml-3 text-gray-600">Loading profile data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-red-600">
          <p className="font-semibold mb-2">Error loading profile</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={refreshUserData}
            className="mt-4 px-4 py-2 bg-[#1F4C73] text-white rounded-lg hover:bg-[#1a3d5c] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {profileFields.map((field) => (
          <ProfileField
            key={field.key}
            label={field.label}
            value={profileData[field.key]}
            onUpdate={() => handleUpdateClick(field)}
          />
        ))}
      </div>

      {modalState.isOpen && (
        <UpdateModal
          key={modalState.field?.key}
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          {...getModalProps()}
        />
      )}
    </>
  );
}
