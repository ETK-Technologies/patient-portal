"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import CustomButton from "@/components/utils/Button";
import { IoMdClose } from "react-icons/io";
import { FaInfoCircle, FaPlus, FaCheck } from "react-icons/fa";
import { FaRegCalendar } from "react-icons/fa";
import { CiFileOn } from "react-icons/ci";

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
  isReadOnly = false,
  readOnlyMessage = "If you need to update this information, please contact support.",
  supportLink = "#",
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
    // For file uploads, initialize as empty array
    if (isFileUpload) {
      return [];
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

  // File upload drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Password visibility state
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Password match validation
  const passwordsMatch =
    value.newPassword &&
    value.confirmPassword &&
    value.newPassword === value.confirmPassword;
  const passwordsMismatch =
    value.newPassword &&
    value.confirmPassword &&
    value.newPassword !== value.confirmPassword;

  // Tooltip state for password requirements
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({
    top: 0,
    left: 0,
    transform: "translateX(-50%)",
  });
  const infoIconRef = useRef(null);

  // Calculate tooltip position with mobile handling
  const calculateTooltipPosition = useCallback(() => {
    if (!infoIconRef.current) return;

    const rect = infoIconRef.current.getBoundingClientRect();
    const tooltipWidth = window.innerWidth < 768 ? 256 : 372; // 256px mobile, 372px desktop
    const tooltipHeight = 200; // Approximate height
    const spacing = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth < 768;

    let top = rect.bottom + spacing;
    let left = rect.left + rect.width / 2;
    let transform = "translateX(-50%)";

    // Mobile positioning adjustments
    if (isMobile) {
      // Check if tooltip would go off right edge
      if (left + tooltipWidth / 2 > viewportWidth - 16) {
        left = viewportWidth - tooltipWidth / 2 - 16;
        transform = "translateX(-50%)";
      }
      // Check if tooltip would go off left edge
      else if (left - tooltipWidth / 2 < 16) {
        left = tooltipWidth / 2 + 16;
        transform = "translateX(-50%)";
      }

      // Check if tooltip would go off bottom edge
      if (top + tooltipHeight > viewportHeight - 16) {
        // Position above the icon instead
        top = rect.top - tooltipHeight - spacing;
        // If still off-screen, position at top with margin
        if (top < 16) {
          top = 16;
        }
      }
    } else {
      // Desktop: check if tooltip would go off bottom
      if (top + tooltipHeight > viewportHeight - 16) {
        top = rect.top - tooltipHeight - spacing;
        if (top < 16) {
          top = 16;
        }
      }
    }

    setTooltipPosition({ top, left, transform });
  }, []);

  // Update tooltip position on scroll/resize to keep it aligned
  useEffect(() => {
    if (showTooltip && infoIconRef.current) {
      calculateTooltipPosition();

      window.addEventListener("scroll", calculateTooltipPosition, true);
      window.addEventListener("resize", calculateTooltipPosition);

      return () => {
        window.removeEventListener("scroll", calculateTooltipPosition, true);
        window.removeEventListener("resize", calculateTooltipPosition);
      };
    }
  }, [showTooltip, calculateTooltipPosition]);

  // Helper to get input className with read-only styling
  const getInputClassName = (baseClassName) => {
    if (isReadOnly) {
      return baseClassName
        .replace("border-gray-300", "border-[#E2E2E1]")
        .replace(
          "focus:ring-2 focus:ring-gray-900 focus:border-transparent",
          "bg-[#FFFFFF] text-[#00000099] cursor-not-allowed"
        );
    }
    return baseClassName;
  };

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
    if (isPasswordField) {
      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        value.newPassword !== undefined
      ) {
        setPasswordStrength(getPasswordStrength(value.newPassword));
      } else {
        setPasswordStrength({ strength: "none", label: "" });
      }
    }
  }, [
    isPasswordField,
    typeof value === "object" && !Array.isArray(value) && value?.newPassword
      ? value.newPassword
      : "",
  ]);

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
    } else if (isFileUpload && Array.isArray(value)) {
      // For file uploads with multiple files, pass the first file
      // (API currently expects a single file, but we allow selecting up to 2 for UI)
      onSave(value[0] || null);
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
      weak: "bg-[#A50E0E]",
      medium: "bg-yellow-500",
      strong: "bg-[#34A853]",
    };

    const textColors = {
      weak: "text-[#A50E0E]",
      medium: "text-yellow-600",
      strong: "text-[#34A853]",
    };

    const fillPercentage = {
      none: 0,
      weak: 33,
      medium: 66,
      strong: 100,
    };

    const currentStrength = passwordStrength.strength || "none";
    const fill = fillPercentage[currentStrength] || 0;

    return (
      <div className="flex items-center gap-2 flex-1">
        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              currentStrength !== "none"
                ? strengthColors[currentStrength]
                : "bg-gray-200"
            }`}
            style={{ width: `${fill}%` }}
          />
        </div>
        {passwordStrength.label && (
          <span
            className={`text-[12px] font-medium ${
              currentStrength !== "none"
                ? textColors[currentStrength]
                : "text-gray-400"
            }`}
          >
            {passwordStrength.label}
          </span>
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
        className={`relative  bg-white rounded-t-[24px] md:w-[560px] md:rounded-[16px] w-full  shadow-xl flex flex-col transform transition-transform duration-300 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        } md:translate-y-0`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[#ffffff] hover:bg-[#F5F4F2] flex items-center justify-center transition-colors cursor-pointer z-10"
        >
          <IoMdClose className="w-5 h-5 text-[#000000]" />
        </button>

        {/* Content */}
        <div className="px-5 py-6 md:px-6 md:py-6 overflow-y-auto modal-scrollbar md:w-[560px]">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {isReadOnly && (
              <p className="text-sm text-[#00000099] mt-2">
                {readOnlyMessage.includes("contact support") ? (
                  <>
                    {readOnlyMessage.split("contact support")[0]}
                    <a
                      href={supportLink}
                      className="underline hover:text-[#00000099]"
                      onClick={(e) => {
                        if (supportLink !== "#") {
                          e.preventDefault();
                          window.location.href = supportLink;
                        }
                      }}
                    >
                      contact support
                    </a>
                    {readOnlyMessage.split("contact support")[1] || "."}
                  </>
                ) : (
                  readOnlyMessage
                )}
              </p>
            )}
            {isPaymentMethodField && !isReadOnly && (
              <p className="text-sm text-[#00000099] mt-2">
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
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={value.currentPassword || ""}
                      onChange={(e) =>
                        setValue({ ...value, currentPassword: e.target.value })
                      }
                      disabled={isReadOnly}
                      readOnly={isReadOnly}
                      className={`${getInputClassName(
                        "w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      )}`}
                      placeholder="Enter your current password"
                    />
                    {value.currentPassword && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            current: !showPasswords.current,
                          })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-700 border border-gray-300 bg-white px-3 py-1 rounded-full hover:text-white hover:bg-black hover:border-black transition-colors"
                      >
                        {showPasswords.current ? "Hide" : "Show"}
                      </button>
                    )}
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={value.newPassword || ""}
                      onChange={(e) =>
                        setValue({ ...value, newPassword: e.target.value })
                      }
                      disabled={isReadOnly}
                      readOnly={isReadOnly}
                      className={`${getInputClassName(
                        "w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      )}`}
                      placeholder="Enter a new password"
                    />
                    {value.newPassword && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            new: !showPasswords.new,
                          })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-700 border border-gray-300 bg-white px-3 py-1 rounded-full hover:text-white hover:bg-black hover:border-black transition-colors"
                      >
                        {showPasswords.new ? "Hide" : "Show"}
                      </button>
                    )}
                  </div>
                  {!isReadOnly && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        {(() => {
                          const fillPercentage = {
                            none: 0,
                            weak: 33,
                            medium: 66,
                            strong: 100,
                          };
                          const currentStrength =
                            passwordStrength.strength || "none";
                          const fill = fillPercentage[currentStrength] || 0;
                          const strengthColors = {
                            weak: "bg-[#A50E0E]",
                            medium: "bg-yellow-500",
                            strong: "bg-[#34A853]",
                          };
                          return (
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                currentStrength !== "none"
                                  ? strengthColors[currentStrength]
                                  : "bg-gray-200"
                              }`}
                              style={{ width: `${fill}%` }}
                            />
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordStrength.label && (
                          <span
                            className={`text-[12px] font-medium ${
                              passwordStrength.strength !== "none"
                                ? passwordStrength.strength === "weak"
                                  ? "text-[#A50E0E]"
                                  : passwordStrength.strength === "medium"
                                  ? "text-yellow-600"
                                  : "text-[#34A853]"
                                : "text-gray-400"
                            }`}
                          >
                            {passwordStrength.label}
                          </span>
                        )}
                        <div className="relative">
                          <FaInfoCircle
                            ref={infoIconRef}
                            className="w-[14px] h-[14px] text-gray-400 cursor-pointer"
                            onMouseEnter={(e) => {
                              // Calculate position immediately
                              calculateTooltipPosition();
                              setShowTooltip(true);
                            }}
                            onMouseLeave={() => setShowTooltip(false)}
                          />
                          {showTooltip &&
                            tooltipPosition.top > 0 &&
                            tooltipPosition.left > 0 &&
                            typeof window !== "undefined" &&
                            createPortal(
                              <div
                                className="fixed z-[99999] w-[256px] md:w-[372px] max-w-[calc(100vw-32px)] text-white text-xs rounded-lg p-3 shadow-lg pointer-events-none"
                                style={{
                                  backgroundColor: "#292929EB",
                                  top: `${tooltipPosition.top}px`,
                                  left: `${tooltipPosition.left}px`,
                                  transform: tooltipPosition.transform,
                                }}
                              >
                                <p className="font-semibold mb-2 text-sm">
                                  Password should contain at least these
                                  requirements:
                                </p>
                                <ul className="space-y-1">
                                  <li className="flex items-center gap-2">
                                    <FaCheck className="w-3 h-3 text-white flex-shrink-0" />
                                    <span>
                                      contains both lower (a-z) and upper case
                                      letters (A-Z)
                                    </span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <FaCheck className="w-3 h-3 text-white flex-shrink-0" />
                                    <span>contains at least 8 characters</span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <FaCheck className="w-3 h-3 text-white flex-shrink-0" />
                                    <span>
                                      contains at least one number (0-9) or a
                                      symbol
                                    </span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <FaCheck className="w-3 h-3 text-white flex-shrink-0" />
                                    <span>
                                      does not contain your name or email
                                      address
                                    </span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <FaCheck className="w-3 h-3 text-white flex-shrink-0" />
                                    <span>
                                      is not commonly used or a previous
                                      password
                                    </span>
                                  </li>
                                </ul>
                              </div>,
                              document.body
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={value.confirmPassword || ""}
                      onChange={(e) =>
                        setValue({ ...value, confirmPassword: e.target.value })
                      }
                      disabled={isReadOnly}
                      readOnly={isReadOnly}
                      className={`${getInputClassName(
                        "w-full px-4 py-3 pr-20 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      )} ${
                        passwordsMismatch
                          ? "border-[#A50E0E]"
                          : passwordsMatch
                          ? "border-[#34A853]"
                          : "border-gray-300"
                      }`}
                      placeholder="Confirm your new password"
                    />
                    {value.confirmPassword && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            confirm: !showPasswords.confirm,
                          })
                        }
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm px-3 py-1 rounded-full transition-colors ${
                          passwordsMismatch
                            ? "text-white bg-black border border-black"
                            : "text-gray-700 border border-gray-300 bg-white hover:text-white hover:bg-black hover:border-black"
                        }`}
                      >
                        {showPasswords.confirm ? "Hide" : "Show"}
                      </button>
                    )}
                  </div>
                  {!isReadOnly && (
                    <div className="mt-2">
                      {passwordsMismatch && (
                        <p className="text-[14px] text-[#A50E0E] flex items-center gap-2">
                          Passwords must match
                        </p>
                      )}
                      {passwordsMatch && (
                        <p className="text-[14px] text-[#0D652D] flex items-center gap-2">
                          <FaCheck className="w-4 h-4" />
                          Passwords match
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : isFileUpload ? (
              isReadOnly ? (
                <div>
                  <input
                    type="text"
                    value={
                      typeof currentValue === "string"
                        ? currentValue
                        : currentValue instanceof File
                        ? currentValue.name
                        : ""
                    }
                    disabled
                    readOnly
                    className="w-full px-4 py-3 border border-[#E2E2E1] rounded-lg bg-[#FFFFFF] text-[#00000099] cursor-not-allowed"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Drag and Drop Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging
                        ? "border-[#0000000A] bg-[#F8F8F8]"
                        : "border-[#0000000A] bg-[#F8F8F8]"
                    }`}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                      const droppedFiles = Array.from(e.dataTransfer.files);
                      if (droppedFiles.length > 0) {
                        const currentFiles = Array.isArray(value) ? value : [];
                        const newFiles = [...currentFiles];
                        // Add files up to a maximum of 2
                        for (
                          let i = 0;
                          i < droppedFiles.length && newFiles.length < 2;
                          i++
                        ) {
                          newFiles.push(droppedFiles[i]);
                        }
                        setValue(newFiles);
                      }
                    }}
                  >
                    {/* Document Icon with Plus */}
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <CiFileOn className="w-12 h-12 text-black" />
                        <div className="absolute -bottom-1 -right-1 bg-[#000000] rounded-full p-1">
                          <FaPlus className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Drag and Drop Text */}
                    <p className="text-sm font-medium mb-2">
                      <span className="hidden md:inline text-[#000000]">
                        Drag and drop files to upload
                      </span>
                      <span
                        className="md:hidden text-[#174EA6] underline cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Tap to upload files
                      </span>
                    </p>

                    {/* File Type Info */}
                    <p className="text-xs text-[#000000] mb-4">
                      PNG, JPG or PDF (5mb max)
                    </p>
                    {Array.isArray(value) && value.length >= 2 && (
                      <p className="text-xs text-amber-600 mb-4">
                        Maximum 2 files allowed
                      </p>
                    )}

                    {/* Or Separator */}
                    <div className="flex items-center gap-3 my-4 max-w-[131px] mx-auto  ">
                      <div className="flex-1 h-px w-[50px] bg-[#E2E2E1]"></div>
                      <span className="text-sm text-[#00000099]">or</span>
                      <div className="flex-1 h-px w-[50px] bg-[#E2E2E1]"></div>
                    </div>

                    {/* Browse Files Button */}
                    <div className="flex justify-center ">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2 bg-[#F8F8F8] border border-[#0000001F] text-[#000000] rounded-full hover:bg-[#0000001F] transition-colors font-medium text-sm"
                      >
                        <span className="hidden md:inline">Browse files</span>
                        <span className="md:hidden">Open camera</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={acceptedFormats}
                        multiple
                        onChange={(e) => {
                          const selectedFiles = Array.from(
                            e.target.files || []
                          );
                          if (selectedFiles.length > 0) {
                            const currentFiles = Array.isArray(value)
                              ? value
                              : [];
                            const newFiles = [...currentFiles];
                            // Add files up to a maximum of 2
                            for (
                              let i = 0;
                              i < selectedFiles.length && newFiles.length < 2;
                              i++
                            ) {
                              newFiles.push(selectedFiles[i]);
                            }
                            setValue(newFiles);
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Files Section */}
                  {Array.isArray(value) && value.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm font-medium text-gray-900 mb-3">
                        Files
                      </p>
                      <div className="space-y-2">
                        {value.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <CiFileOn className="w-5 h-5  text-black shrink-0" />
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm text-[#00000099]">
                                {(file.size / (1024 * 1024)).toFixed(1)}MB
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newFiles = value.filter(
                                    (_, i) => i !== index
                                  );
                                  setValue(
                                    newFiles.length > 0 ? newFiles : null
                                  );
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = "";
                                  }
                                }}
                                className="text-[#000000] text-sm hover:text-[#000000] transition-colors"
                              >
                                <IoMdClose className="w-5 h-5 text-[#000000]" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
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
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                    maxLength={19} // 16 digits + 3 spaces
                    className={getInputClassName(
                      "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    )}
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
                      disabled={isReadOnly}
                      readOnly={isReadOnly}
                      maxLength={5}
                      className={getInputClassName(
                        "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      )}
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
                      disabled={isReadOnly}
                      readOnly={isReadOnly}
                      maxLength={4}
                      className={getInputClassName(
                        "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                      )}
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
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                    className={getInputClassName(
                      "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    )}
                    placeholder="Name on card"
                  />
                </div>
              </>
            ) : isNameField ? (
              isReadOnly ? (
                <div>
                  <input
                    type="text"
                    value={
                      typeof currentValue === "object" && currentValue.firstName
                        ? `${currentValue.firstName} ${
                            currentValue.lastName || ""
                          }`.trim()
                        : typeof currentValue === "string"
                        ? currentValue
                        : ""
                    }
                    disabled
                    readOnly
                    className="w-full px-4 py-3 border border-[#E2E2E1] rounded-lg bg-[#FFFFFF] text-[#00000099] cursor-not-allowed"
                  />
                </div>
              ) : (
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
              )
            ) : isTagInput ? (
              isReadOnly ? (
                <div>
                  <input
                    type="text"
                    value={
                      typeof currentValue === "string"
                        ? currentValue
                        : tags.length > 0
                        ? tags.join(", ")
                        : ""
                    }
                    disabled
                    readOnly
                    className="w-full px-4 py-3 border border-[#E2E2E1] rounded-lg bg-[#FFFFFF] text-[#00000099] cursor-not-allowed"
                  />
                </div>
              ) : (
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
                            <IoMdClose className="w-3 h-3" />
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
              )
            ) : (
              <div>
                {!(
                  isReadOnly &&
                  (label.toLowerCase().includes("email") ||
                    label.toLowerCase().includes("date of birth"))
                ) && (
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                  </label>
                )}
                <div className="relative">
                  <input
                    type={inputType}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                    className={`${getInputClassName(
                      "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    )} ${isReadOnly && inputType === "date" ? "pr-12" : ""}`}
                    placeholder={
                      placeholder || `Enter your ${label.toLowerCase()}`
                    }
                  />
                  {isReadOnly && inputType === "date" && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <FaRegCalendar className="w-5 h-5 text-[#00000099]" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isReadOnly && (
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
                    : "bg-black border border-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
          )}
        </div>
      </div>
    </div>
  );
}
