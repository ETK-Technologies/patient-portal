"use client";

import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import ProfileField from "./ProfileField";
import UpdateModal from "@/components/utils/UpdateModal";
import { initialProfileData, profileFields } from "./profileData";
import { useUser } from "@/contexts/UserContext";

// Helper function to map CRM data to profile format
function mapUserDataToProfile(userData) {
  if (!userData) return initialProfileData;

  // Handle different response structures:
  // 1. New structure: { status: true, message: "...", user: {...} }
  // 2. Old structure: { status: true, message: "...", data: { user: {...} } }
  // 3. Direct user object: { id, email, first_name, ... }
  let actualUserData = userData;

  // Check if it's the new response structure with user at top level
  if (userData.status && userData.user) {
    actualUserData = userData.user;
  }
  // Check if it's the old response structure with data.user
  else if (userData.status && userData.data && userData.data.user) {
    actualUserData = userData.data.user;
  }
  // Check if it's a data object containing user
  else if (userData.data && userData.data.user) {
    actualUserData = userData.data.user;
  }
  // Otherwise, assume it's already the user object

  // Extract billing/shipping address if available
  const billing = actualUserData.billing || {};
  const shipping = actualUserData.shipping || {};

  // Get first and last name (handle encrypted data gracefully)
  const firstName = actualUserData.first_name || "";
  const lastName = actualUserData.last_name || "";

  // Combine first and last name for display, fallback to name if available
  const fullName =
    actualUserData.name || `${firstName} ${lastName}`.trim() || "";

  return {
    fullName: fullName,
    email: actualUserData.email || "",
    dateOfBirth: actualUserData.date_of_birth || actualUserData.dob || "",
    phoneNumber: actualUserData.phone_number || actualUserData.phone || "",
    address:
      shipping.address_1 || billing.address_1 || actualUserData.address || "",
    city: shipping.city || billing.city || actualUserData.city || "",
    province:
      shipping.state ||
      billing.state ||
      actualUserData.province ||
      actualUserData.state ||
      "",
    postalCode:
      shipping.postcode ||
      billing.postcode ||
      actualUserData.postal_code ||
      actualUserData.zip_code ||
      "",
    photoId: actualUserData.photo_id || "",
    insuranceCard:
      actualUserData.insurance_card_image ||
      actualUserData.insurance_card ||
      "",
    // Store first and last name separately for editing
    firstName: firstName,
    lastName: lastName,
    gender: actualUserData.gender || "",
    avatar: actualUserData.avatar || actualUserData.profile_photo_url || "",
  };
}

export default function ProfileManager() {
  const { userData, loading, error, refreshUserData } = useUser();
  console.log("[PROFILE_MANAGER] User data:", userData);

  // Derive mapped profile data from userData
  const mappedProfileData = useMemo(() => {
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

  // Helper function to convert date format from MM/DD/YYYY to YYYY-MM-DD
  const convertDateFormat = (dateValue) => {
    if (!dateValue) return dateValue;

    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    // Try to parse MM/DD/YYYY format
    const mmddyyyyMatch = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyyMatch) {
      const [, month, day, year] = mmddyyyyMatch;
      // Pad month and day with leading zeros if needed
      const paddedMonth = month.padStart(2, "0");
      const paddedDay = day.padStart(2, "0");
      return `${year}-${paddedMonth}-${paddedDay}`;
    }

    // If format is not recognized, return as is (let API handle validation)
    return dateValue;
  };

  const handleSave = async (newValue) => {
    const fieldKey = modalState.field.key;

    // API Logic
    try {
      // Convert date format if it's dateOfBirth field
      let processedValue = newValue;
      if (fieldKey === "dateOfBirth" && typeof newValue === "string") {
        processedValue = convertDateFormat(newValue);
        console.log(
          `[PROFILE_UPDATE] Date conversion: ${newValue} -> ${processedValue}`
        );
      }

      // Check if this is a file upload (photoId or insuranceCard)
      const isFileUpload =
        fieldKey === "photoId" || fieldKey === "insuranceCard";
      const isFile = newValue instanceof File;

      let response;
      if (isFileUpload && isFile) {
        // For file uploads, use FormData
        const formData = new FormData();
        formData.append("field", fieldKey);
        formData.append("file", newValue);

        response = await fetch("/api/user/profile", {
          method: "POST",
          // Don't set Content-Type header - browser will set it with boundary
          body: formData,
        });
      } else {
        // For other fields, use JSON
        const requestBody =
          fieldKey === "password" && typeof newValue === "object"
            ? {
                field: fieldKey,
                currentPassword: newValue.currentPassword,
                newPassword: newValue.newPassword,
                confirmPassword: newValue.confirmPassword,
              }
            : {
                field: fieldKey,
                value: processedValue,
              };

        response = await fetch("/api/user/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
      }

      const result = await response.json();

      // Handle both response formats:
      // New format: { status: true/false, message: "...", user: {...} }
      // Old format: { success: true/false, error: "...", data: {...} }
      const isSuccess = result.status === true || result.success === true;

      if (!response.ok || !isSuccess) {
        const errorMessage = result.error || result.message || "Unknown error";
        console.error("Failed to update profile:", errorMessage);
        toast.error(
          `Failed to update ${modalState.field.label}: ${errorMessage}`,
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
      } else if (fieldKey === "password") {
        // Password is masked, don't update the display value
        setEditedFields((prev) => ({
          ...prev,
          [fieldKey]: "••••••••••",
        }));
      } else if (fieldKey === "dateOfBirth") {
        // Store the processed (converted) date value
        setEditedFields((prev) => ({
          ...prev,
          [fieldKey]: processedValue,
        }));
      } else if (fieldKey === "photoId" || fieldKey === "insuranceCard") {
        // For file uploads, store the filename for display, but keep the File object for sending
        setEditedFields((prev) => ({
          ...prev,
          [fieldKey]: newValue instanceof File ? newValue.name : newValue,
        }));
      } else {
        // Store edited value
        setEditedFields((prev) => ({
          ...prev,
          [fieldKey]: newValue,
        }));
      }

      // Small delay to allow CRM to process the update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Refresh user data from server to get latest data
      await refreshUserData();

      // Clear the edited field from local state after successful update and refresh
      // This ensures we show the server's version of the data
      setEditedFields((prev) => {
        const updated = { ...prev };
        delete updated[fieldKey];
        // Also clear firstName/lastName if it was a fullName update
        if (fieldKey === "fullName") {
          delete updated.firstName;
          delete updated.lastName;
        }
        return updated;
      });

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

    // Special handling for password - use 3 fields
    const isPasswordField = field.key === "password";

    return {
      title: field.key === "password" ? field.label : `Update ${field.label}`,
      label: field.label,
      currentValue: isNameField
        ? { firstName: profileData.firstName, lastName: profileData.lastName }
        : field.key === "password"
        ? "" // Don't show the masked password in the input
        : profileData[field.key],
      inputType: inputTypeMap[field.key] || "text",
      isFileUpload: isFileUpload,
      isNameField: isNameField,
      isPasswordField: isPasswordField,
      placeholder: `Enter your ${field.label.toLowerCase()}`,
    };
  };

  // Show loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-[#1F4C73] border-r-transparent"></div>
          <span className="ml-3 text-gray-600">Loading profile data...</span>
        </div>
      </div>
    );
  }

  // Show error state
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

  // Helper function to format field value - show "NA" for missing/empty values
  const formatFieldValue = (fieldKey, value) => {
    // For password field, show masked value or "NA" if not set
    if (fieldKey === "password") {
      return value || "NA";
    }
    // Handle File objects (for photoId and insuranceCard)
    if (value instanceof File) {
      return value.name || "File selected";
    }
    // For all other fields, show "NA" if empty, null, or undefined
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return "NA";
    }
    return value;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {profileFields.map((field) => (
          <ProfileField
            key={field.key}
            label={field.label}
            value={formatFieldValue(field.key, profileData[field.key])}
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
