"use client";

import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import ProfileField from "./ProfileField";
import UpdateModal from "@/components/utils/UpdateModal";
import {
  initialProfileData,
  profileFields,
  dummyProfileData,
} from "./profileData";
import { useUser } from "@/contexts/UserContext";

// TODO: Set to false when APIs are ready
const USE_DUMMY_DATA = true;

// Helper function to map CRM data to profile format
function mapUserDataToProfile(userData) {
  if (!userData) return initialProfileData;

  // Extract billing/shipping address if available
  const billing = userData.billing || {};
  const shipping = userData.shipping || {};

  // Get first and last name (handle encrypted data gracefully)
  const firstName = userData.first_name || "";
  const lastName = userData.last_name || "";

  // Combine first and last name for display, fallback to name if available
  const fullName = userData.name || `${firstName} ${lastName}`.trim() || "";

  return {
    fullName: fullName,
    email: userData.email || "",
    dateOfBirth: userData.date_of_birth || userData.dob || "",
    phoneNumber: userData.phone_number || userData.phone || "",
    address: shipping.address_1 || billing.address_1 || userData.address || "",
    city: shipping.city || billing.city || userData.city || "",
    province:
      shipping.state ||
      billing.state ||
      userData.province ||
      userData.state ||
      "",
    postalCode:
      shipping.postcode ||
      billing.postcode ||
      userData.postal_code ||
      userData.zip_code ||
      "",
    photoId: userData.photo_id || "",
    insuranceCard:
      userData.insurance_card_image || userData.insurance_card || "",
    // Store first and last name separately for editing
    firstName: firstName,
    lastName: lastName,
    gender: userData.gender || "",
    avatar: userData.avatar || userData.profile_photo_url || "",
  };
}

export default function ProfileManager() {
  const { userData, loading, error, refreshUserData } = useUser();

  // Derive mapped profile data from userData
  // Use dummy data when USE_DUMMY_DATA is true or when userData is not available
  const mappedProfileData = useMemo(() => {
    if (USE_DUMMY_DATA) {
      return dummyProfileData;
    }
    return mapUserDataToProfile(userData);
  }, [userData]);

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

    // TODO: Remove this block when APIs are ready - use dummy data for now
    if (USE_DUMMY_DATA) {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update local state for dummy data
      if (fieldKey === "fullName" && typeof newValue === "object") {
        // newValue is an object with firstName and lastName
        setEditedFields((prev) => ({
          ...prev,
          firstName: newValue.firstName,
          lastName: newValue.lastName,
          fullName: `${newValue.firstName} ${newValue.lastName}`.trim(),
        }));
      } else if (fieldKey === "password") {
        // Password is masked, don't update the display value
        setEditedFields((prev) => ({
          ...prev,
          [fieldKey]: "••••••••••",
        }));
      } else {
        // Store edited value
        setEditedFields((prev) => ({
          ...prev,
          [fieldKey]: newValue,
        }));
      }

      // Show success message
      toast.success(`${modalState.field.label} updated successfully`, {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // API Logic - This will be used when APIs are ready
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
          `Failed to update ${modalState.field.label}: ${
            result.error || "Unknown error"
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
      password: "password",
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
        : field.key === "password"
        ? "" // Don't show the masked password in the input
        : profileData[field.key],
      inputType: inputTypeMap[field.key] || "text",
      isFileUpload: isFileUpload,
      isNameField: isNameField,
      placeholder: `Enter your ${field.label.toLowerCase()}`,
    };
  };

  // Show loading state only when not using dummy data
  if (!USE_DUMMY_DATA && loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-[#1F4C73] border-r-transparent"></div>
          <span className="ml-3 text-gray-600">Loading profile data...</span>
        </div>
      </div>
    );
  }

  // Show error state only when not using dummy data
  if (!USE_DUMMY_DATA && error) {
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
