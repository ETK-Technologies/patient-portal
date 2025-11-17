"use client";

import { useState, useEffect } from "react";
import CustomButton from "@/components/utils/Button";
import { IoMdClose } from "react-icons/io";
import { FaInfoCircle, FaTimes } from "react-icons/fa";

const ANIMATION_DURATION = 300;

// Password strength checker
const getPasswordStrength = (password) => {
  if (!password || password.length === 0)
    return { strength: "none", label: "" };
  if (password.length < 6) return { strength: "weak", label: "Weak" };
  if (password.length < 8) return { strength: "medium", label: "Medium" };
  if (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  ) {
    return { strength: "strong", label: "Strong" };
  }
  return { strength: "medium", label: "Medium" };
};

export default function UpdateModal({
  isOpen,
  onClose,
  title,
  label,
  currentValue,
  onSave,
  inputType = "text",
  isFileUpload = false,
  isNameField = false,
  isPasswordField = false,
  isPaymentMethodField = false,
  isTagInput = false,
  acceptedFormats = "image/*,.pdf",
  placeholder = "",
}) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  // Handle name field with two inputs (first and last)
  const getInitialValue = () => {
    if (isPasswordField) {
      return {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      };
    }
    if (isPaymentMethodField) {
      return {
        cardNumber: "",
        expiry: "",
        cvc: "",
        nameOnCard: "",
      };
    }
    if (isNameField && typeof currentValue === "object") {
      return {
        firstName: currentValue.firstName || "",
        lastName: currentValue.lastName || "",
      };
    }
    return isNameField ? { firstName: "", lastName: "" } : currentValue;
  };

  // Parse comma-separated string to tags array
  const parseTagsFromValue = (val) => {
    if (!val || val === "Not Provided" || val.trim() === "") {
      return [];
    }
    return val
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");
  };

  const [value, setValue] = useState(getInitialValue());
  const [passwordStrength, setPasswordStrength] = useState({
    strength: "none",
    label: "",
  });

  // Tag input state
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  // Handle mount/unmount animation
  useEffect(() => {
    let mountRafId;
    let visibilityRafId;
    let unmountTimeoutId;

    if (isOpen) {
      mountRafId = window.requestAnimationFrame(() => {
        setIsVisible(false);
        setIsMounted(true);

        visibilityRafId = window.requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      mountRafId = window.requestAnimationFrame(() => {
        setIsVisible(false);

        unmountTimeoutId = window.setTimeout(() => {
          setIsMounted(false);
        }, ANIMATION_DURATION);
      });
    }

    return () => {
      if (mountRafId) {
        window.cancelAnimationFrame(mountRafId);
      }
      if (visibilityRafId) {
        window.cancelAnimationFrame(visibilityRafId);
      }
      if (unmountTimeoutId) {
        window.clearTimeout(unmountTimeoutId);
      }
    };
  }, [isOpen]);

  // Update value when currentValue changes (e.g., when modal reopens with new data)
  useEffect(() => {
    if (isOpen) {
      setValue(getInitialValue());
      if (isPasswordField) {
        setPasswordStrength({ strength: "none", label: "" });
      }
      if (isTagInput) {
        const parsedTags = parseTagsFromValue(currentValue);
        setTags(parsedTags);
        setTagInput("");
      }
    }
  }, [
    isOpen,
    currentValue,
    isNameField,
    isPasswordField,
    isPaymentMethodField,
    isTagInput,
  ]);

  // Update password strength when new password changes
  useEffect(() => {
    if (isPasswordField && value.newPassword !== undefined) {
      setPasswordStrength(getPasswordStrength(value.newPassword));
    }
  }, [isPasswordField, value.newPassword]);

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

  // Handle adding a tag
  const handleAddTag = () => {
    const trimmedInput = tagInput.trim();
    if (trimmedInput && !tags.includes(trimmedInput)) {
      setTags([...tags, trimmedInput]);
      setTagInput("");
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Handle Enter key in tag input
  const handleTagInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = () => {
    if (isTagInput) {
      // Convert tags array to comma-separated string
      // Also include any pending input value that hasn't been added as a tag yet
      const allTags = [...tags];
      const trimmedInput = tagInput.trim();
      if (trimmedInput && !allTags.includes(trimmedInput)) {
        allTags.push(trimmedInput);
      }
      const tagsString = allTags.join(",");
      onSave(tagsString);
    } else if (isPasswordField) {
      // Validate passwords match
      if (value.newPassword !== value.confirmPassword) {
        alert("New password and confirm password do not match");
        return;
      }
      if (
        !value.currentPassword ||
        !value.newPassword ||
        !value.confirmPassword
      ) {
        alert("Please fill in all password fields");
        return;
      }
      // Pass password object with all three fields
      onSave(value);
    } else if (isPaymentMethodField) {
      // Validate payment method fields
      if (
        !value.cardNumber ||
        !value.expiry ||
        !value.cvc ||
        !value.nameOnCard
      ) {
        alert("Please fill in all payment method fields");
        return;
      }
      // Pass payment method object with all fields
      onSave(value);
    } else if (isNameField) {
      // For name field, pass the object with firstName and lastName
      onSave(value);
    } else {
      // For other fields, pass the value directly
      onSave(value);
    }
    onClose();
  };

  // Check if password is valid (all fields filled and matching)
  const isPasswordValid =
    isPasswordField &&
    value.currentPassword &&
    value.newPassword &&
    value.confirmPassword &&
    value.newPassword === value.confirmPassword;

  // Check if payment method is valid (all fields filled)
  const isPaymentMethodValid =
    isPaymentMethodField &&
    value.cardNumber &&
    value.expiry &&
    value.cvc &&
    value.nameOnCard;

  // Password strength indicator bars
  const renderPasswordStrengthBars = () => {
    if (!isPasswordField) return null;

    const strengthColors = {
      weak: "bg-red-500",
      medium: "bg-yellow-500",
      strong: "bg-green-500",
    };

    const textColors = {
      weak: "text-red-600",
      medium: "text-yellow-600",
      strong: "text-green-600",
    };

    const barCount = {
      none: 0,
      weak: 1,
      medium: 2,
      strong: 4,
    };

    const currentStrength = passwordStrength.strength || "none";
    const currentBarCount = barCount[currentStrength] || 0;

    return (
      <div className="flex items-center gap-2 mt-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={`h-1 w-8 rounded transition-colors duration-200 ${
                bar <= currentBarCount && currentStrength !== "none"
                  ? strengthColors[currentStrength]
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        {passwordStrength.label && (
          <div className="flex items-center gap-1">
            <span
              className={`text-sm font-medium ${
                currentStrength !== "none"
                  ? textColors[currentStrength]
                  : "text-gray-400"
              }`}
            >
              {passwordStrength.label}
            </span>
            <FaInfoCircle
              className={`w-3 h-3 ${
                currentStrength !== "none"
                  ? textColors[currentStrength]
                  : "text-gray-400"
              }`}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-end justify-center pt-[36px] md:items-center md:p-8 transition-opacity duration-300 ${
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
        className={`relative bg-white rounded-t-[24px] md:rounded-[24px] w-full max-w-md shadow-xl flex flex-col transform transition-transform duration-300 ease-out ${
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
        <div className="px-5 py-6 md:px-8 md:py-8 overflow-y-auto modal-scrollbar">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {isPaymentMethodField && (
              <p className="text-sm text-gray-600 mt-1">
                Please update your payment method
              </p>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {isPasswordField ? (
              <>
                {/* Current Password */}
                <div>
                  <input
                    type="password"
                    value={value.currentPassword || ""}
                    onChange={(e) =>
                      setValue({ ...value, currentPassword: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="Enter your current password"
                  />
                </div>

                {/* New Password */}
                <div>
                  <input
                    type="password"
                    value={value.newPassword || ""}
                    onChange={(e) =>
                      setValue({ ...value, newPassword: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="Enter a new password"
                  />
                  {renderPasswordStrengthBars()}
                </div>

                {/* Confirm Password */}
                <div>
                  <input
                    type="password"
                    value={value.confirmPassword || ""}
                    onChange={(e) =>
                      setValue({ ...value, confirmPassword: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="Confirm your new password"
                  />
                </div>
              </>
            ) : isFileUpload ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {label}
                </label>
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
            ) : isPaymentMethodField ? (
              <>
                {/* Credit Card Number */}
                <div>
                  <input
                    type="text"
                    value={value.cardNumber || ""}
                    onChange={(e) => {
                      // Format card number with spaces every 4 digits
                      let formatted = e.target.value.replace(/\s/g, "");
                      formatted = formatted.replace(/(.{4})/g, "$1 ").trim();
                      // Limit to 16 digits
                      if (formatted.replace(/\s/g, "").length > 16) {
                        formatted = formatted
                          .replace(/\s/g, "")
                          .slice(0, 16)
                          .replace(/(.{4})/g, "$1 ")
                          .trim();
                      }
                      setValue({ ...value, cardNumber: formatted });
                    }}
                    maxLength={19} // 16 digits + 3 spaces
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="Credit card number"
                  />
                </div>

                {/* Expiry and CVC in a row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      value={value.expiry || ""}
                      onChange={(e) => {
                        // Format expiry as MM/YY
                        let formatted = e.target.value.replace(/\D/g, "");
                        if (formatted.length >= 2) {
                          formatted =
                            formatted.slice(0, 2) + "/" + formatted.slice(2, 4);
                        }
                        setValue({ ...value, expiry: formatted });
                      }}
                      maxLength={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      placeholder="Expiry MM/YY"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={value.cvc || ""}
                      onChange={(e) => {
                        // Only allow numbers, max 4 digits
                        const formatted = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4);
                        setValue({ ...value, cvc: formatted });
                      }}
                      maxLength={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      placeholder="CVC"
                    />
                  </div>
                </div>

                {/* Name on Card */}
                <div>
                  <input
                    type="text"
                    value={value.nameOnCard || ""}
                    onChange={(e) =>
                      setValue({ ...value, nameOnCard: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="Name on card"
                  />
                </div>
              </>
            ) : isNameField ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={value.firstName || ""}
                    onChange={(e) =>
                      setValue({ ...value, firstName: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={value.lastName || ""}
                    onChange={(e) =>
                      setValue({ ...value, lastName: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
            ) : isTagInput ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {label}
                </label>
                {/* Tags display */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-600 transition-colors"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Tag input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder={
                      placeholder ||
                      `Type and press Enter to add ${label.toLowerCase()}`
                    }
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {label}
                </label>
                <input
                  type={inputType}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                  placeholder={
                    placeholder || `Enter your ${label.toLowerCase()}`
                  }
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6">
            <CustomButton
              text={
                isPasswordField || isPaymentMethodField
                  ? "Save"
                  : "Save Changes"
              }
              onClick={handleSave}
              variant="default"
              size="medium"
              width="full"
              className={
                isPasswordField || isPaymentMethodField
                  ? isPasswordValid || isPaymentMethodValid
                    ? "bg-black border border-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    : "!bg-[#00000033] border border-[#C9C5BF] text-white hover:bg-[#A5A4A2] disabled:opacity-50 disabled:cursor-not-allowed"
                  : ""
              }
              disabled={
                (isPasswordField &&
                  (!value.currentPassword ||
                    !value.newPassword ||
                    !value.confirmPassword ||
                    value.newPassword !== value.confirmPassword)) ||
                (isPaymentMethodField &&
                  (!value.cardNumber ||
                    !value.expiry ||
                    !value.cvc ||
                    !value.nameOnCard))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
