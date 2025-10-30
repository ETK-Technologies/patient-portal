"use client";

import { useState } from "react";
import ProfileField from "../profile/ProfileField";
import UpdateModal from "@/components/utils/UpdateModal";
import {
  initialMedicalHistoryData,
  medicalHistoryFields,
} from "./medicalHistoryData";

export default function MedicalHistoryManager() {
  const [medicalHistoryData, setMedicalHistoryData] = useState(
    initialMedicalHistoryData
  );
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
    setMedicalHistoryData((prev) => ({
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

    return {
      title: `Update ${field.label}`,
      label: field.label,
      currentValue: medicalHistoryData[field.key],
      inputType: "text",
      isFileUpload: false,
      placeholder: `Enter your ${field.label.toLowerCase()}`,
    };
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {medicalHistoryFields.map((field) => (
          <ProfileField
            key={field.key}
            label={field.label}
            value={medicalHistoryData[field.key]}
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
