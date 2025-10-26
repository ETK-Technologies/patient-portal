"use client";

import { useState } from "react";
import ProfileField from "../profile/ProfileField";
import UpdateModal from "@/components/utils/UpdateModal";
import {
  initialBillingShippingData,
  billingShippingFields,
} from "./billingShippingData";

export default function BillingShippingManager() {
  const [billingShippingData, setBillingShippingData] = useState(
    initialBillingShippingData
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
    setBillingShippingData((prev) => ({
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
      currentValue: billingShippingData[field.key],
      inputType: "text",
      isFileUpload: false,
      placeholder: `Enter your ${field.label.toLowerCase()}`,
    };
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
