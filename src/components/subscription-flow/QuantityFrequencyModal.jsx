"use client";

import { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";

const ANIMATION_DURATION = 300;

export default function QuantityFrequencyModal({
  isOpen,
  onClose,
  onSave,
  currentValue = "8 pills / month",
}) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  const [formData, setFormData] = useState({
    quantityFrequency: currentValue,
    providerMessage: "",
  });

  // Handle mount/unmount animation
  useEffect(() => {
    let visibilityTimeoutId;
    let unmountTimeoutId;

    if (isOpen) {
      setIsMounted(true);
      setIsVisible(false);
      visibilityTimeoutId = setTimeout(() => {
        setIsVisible(true);
      }, 50);
    } else {
      setIsVisible(false);
      unmountTimeoutId = setTimeout(() => {
        setIsMounted(false);
      }, ANIMATION_DURATION);
    }

    return () => {
      if (visibilityTimeoutId) {
        clearTimeout(visibilityTimeoutId);
      }
      if (unmountTimeoutId) {
        clearTimeout(unmountTimeoutId);
      }
    };
  }, [isOpen]);

  // Update form data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        quantityFrequency: currentValue,
        providerMessage: "",
      });
    }
  }, [isOpen, currentValue]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isMounted) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Check if form is valid (quantity frequency is selected)
  const isFormValid =
    formData.quantityFrequency && formData.quantityFrequency.trim() !== "";

  const handleSubmit = () => {
    if (!isFormValid) {
      return;
    }
    onSave({
      quantityFrequency: formData.quantityFrequency,
      providerMessage: formData.providerMessage,
    });
    onClose();
  };

  // Quantity & frequency options
  const quantityOptions = [
    "4 pills / month",
    "6 pills / month",
    "8 pills / month",
    "10 pills / month",
    "12 pills / month",
  ];

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-end justify-center pt-[36px] md:items-center md:p-8 transition-opacity duration-300 overflow-hidden ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-t-[24px] md:rounded-[24px] w-full max-w-xl max-h-[95vh] md:max-h-[95vh] shadow-xl flex flex-col transform transition-transform duration-300 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        } md:translate-y-0`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[#F4F4F4] hover:bg-[#F5F4F2] flex items-center justify-center transition-colors cursor-pointer z-10"
        >
          <IoMdClose className="w-5 h-5 text-black" />
        </button>

        {/* Content */}
        <div className="p-5 overflow-y-auto modal-scrollbar">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Update Quantity & Frequency
            </h2>
            <p className="text-sm text-[#00000099] mt-2">
              This request will be sent to your clinician for approval.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Quantity & Frequency Dropdown */}
            <div className="relative">
              <select
                value={formData.quantityFrequency}
                onChange={(e) =>
                  handleChange("quantityFrequency", e.target.value)
                }
                className="w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white appearance-none cursor-pointer text-gray-900"
                style={{
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                  paddingRight: "2.5rem",
                }}
              >
                {quantityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <label className="absolute top-2 left-4 text-xs text-gray-500 pointer-events-none">
                Quantity & frequency
              </label>
            </div>

            {/* Provider Message Textarea */}
            <div className="relative">
              <textarea
                value={formData.providerMessage}
                onChange={(e) =>
                  handleChange("providerMessage", e.target.value)
                }
                rows={4}
                className="w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none"
              />
              <label className="absolute top-2 left-4 text-xs text-gray-500 pointer-events-none">
                Provider message
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                isFormValid
                  ? "bg-black text-white hover:bg-gray-800 cursor-pointer"
                  : "bg-[#00000033] text-white hover:bg-gray-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              Submit request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
