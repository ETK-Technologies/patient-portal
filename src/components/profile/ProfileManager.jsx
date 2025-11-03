"use client";

import { useState, useEffect } from "react";
import ProfileField from "./ProfileField";
import UpdateModal from "@/components/utils/UpdateModal";
import { initialProfileData, profileFields } from "./profileData";
import { useUser } from "@/contexts/UserContext";

// Helper function to map CRM data to profile format
function mapUserDataToProfile(userData) {
  if (!userData) return initialProfileData;

  return {
    fullName: userData.full_name || userData.name || "",
    email: userData.email || "",
    dateOfBirth: userData.date_of_birth || userData.dob || "",
    phoneNumber: userData.phone || userData.phone_number || "",
    address: userData.address || "",
    city: userData.city || "",
    province: userData.province || userData.state || "",
    postalCode: userData.postal_code || userData.zip_code || "",
    photoId: userData.photo_id || "",
    insuranceCard: userData.insurance_card || "",
  };
}

export default function ProfileManager() {
  const { userData, loading, error, refreshUserData } = useUser();

  // Initialize with mapped user data or defaults
  const [profileData, setProfileData] = useState(() =>
    mapUserDataToProfile(userData)
  );

  const [modalState, setModalState] = useState({
    isOpen: false,
    field: null,
  });

  // Update profile data when userData changes
  // This is valid - synchronizing external data (userData from context) with local state
  // eslint-disable-next-line react-compiler/react-compiler
  useEffect(() => {
    if (userData) {
      setProfileData(mapUserDataToProfile(userData));
    }
  }, [userData]);

  const handleUpdateClick = (field) => {
    setModalState({
      isOpen: true,
      field: field,
    });
  };

  const handleSave = async (newValue) => {
    // Update local state
    setProfileData((prev) => ({
      ...prev,
      [modalState.field.key]: newValue,
    }));

    // TODO: Update user data in CRM via API
    // For now, we just update local state
    // Later you can add: await updateUserProfile(modalState.field.key, newValue);

    // Refresh user data after update
    // await refreshUserData();
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

    return {
      title: `Update ${field.label}`,
      label: field.label,
      currentValue: profileData[field.key],
      inputType: inputTypeMap[field.key] || "text",
      isFileUpload: isFileUpload,
      placeholder: `Enter your ${field.label.toLowerCase()}`,
    };
  };

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
