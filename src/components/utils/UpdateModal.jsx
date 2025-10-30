"use client";

import { useState } from "react";
import CustomButton from "@/components/utils/Button";
import { IoMdClose } from "react-icons/io";

export default function UpdateModal({
  isOpen,
  onClose,
  title,
  label,
  currentValue,
  onSave,
  inputType = "text",
  isFileUpload = false,
  acceptedFormats = "image/*,.pdf",
  placeholder = "",
}) {
  const [value, setValue] = useState(currentValue);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <IoMdClose />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          {isFileUpload ? (
            <div className="space-y-3">
              <input
                type="file"
                accept={acceptedFormats}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setValue(file.name);
                  }
                }}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border file:border-gray-300
                  file:text-sm file:font-medium
                  file:bg-white file:text-gray-900
                  hover:file:bg-gray-50
                  cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                Accepted formats: JPG, PNG, PDF (Max 5MB)
              </p>
            </div>
          ) : (
            <input
              type={inputType}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              placeholder={placeholder || `Enter your ${label.toLowerCase()}`}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <CustomButton
            text="Cancel"
            onClick={onClose}
            variant="secondary"
            size="medium"
            width="auto"
          />
          <CustomButton
            text="Save Changes"
            onClick={handleSave}
            variant="default"
            size="medium"
            width="auto"
          />
        </div>
      </div>
    </div>
  );
}
