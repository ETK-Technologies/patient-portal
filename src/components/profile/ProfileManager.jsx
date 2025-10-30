"use client";

import { useState } from "react";
import ProfileField from "./ProfileField";
import UpdateModal from "@/components/utils/UpdateModal";
import { initialProfileData, profileFields } from "./profileData";

export default function ProfileManager() {
  const [profileData, setProfileData] = useState(initialProfileData);
  const [modalState, setModalState] = useState({
    isOpen: false,
    field: null,
  });

  const handleUpdateClick = (field) => {
    setModalState({
      isOpen: true,
      field: field,
    });
  };

  const handleSave = (newValue) => {
    setProfileData((prev) => ({
      ...prev,
      [modalState.field.key]: newValue,
    }));
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
