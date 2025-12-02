"use client";

import { useState, useEffect } from "react";
import CustomButton from "@/components/utils/Button";
import { IoMdClose } from "react-icons/io";
import PostCanadaAddressAutocomplete from "@/components/utils/PostCanada/PostCanadaAddressAutocomplete";

const ANIMATION_DURATION = 300;

export default function ShippingAddressModal({
  isOpen,
  onClose,
  onSave,
  shippingData = {},
}) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  const [formData, setFormData] = useState({
    id: null, // shipping_address_id
    first_name: "",
    last_name: "",
    email: "",
    address_1: "",
    address_2: "",
    city: "",
    postcode: "",
    country: "",
    state: "",
  });

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

  // Update form data when modal opens or shippingData changes
  useEffect(() => {
    if (isOpen && shippingData) {
      setFormData({
        id: shippingData.id || null, // shipping_address_id
        first_name: shippingData.first_name || "",
        last_name: shippingData.last_name || "",
        email: shippingData.email || "",
        address_1: shippingData.address_1 || "",
        address_2: shippingData.address_2 || "",
        city: shippingData.city || "",
        postcode: shippingData.postcode || "",
        country: "CA", // Fixed to Canada
        state: shippingData.state || "",
      });
    }
  }, [isOpen, shippingData]);

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
    // Prevent changing country field
    if (field === "country") {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle address autocomplete change
  const handleAddressChange = (e) => {
    const value = e.target.value;
    handleChange("address_1", value);
  };

  // Handle address selection from autocomplete
  const handleAddressSelected = (addressData) => {
    console.log("[SHIPPING_ADDRESS_MODAL] Address selected:", addressData);
    setFormData((prev) => ({
      ...prev,
      address_1: addressData.address_1 || prev.address_1,
      address_2: addressData.address_2 || prev.address_2,
      city: addressData.city || prev.city,
      state: addressData.state || prev.state,
      postcode: addressData.postcode || prev.postcode,
      country: "CA", // Always set to Canada
    }));
  };

  const handleSave = () => {
    console.log("[SHIPPING_ADDRESS_MODAL] Saving shipping address:", formData);
    // Ensure country is always "CA" when saving
    const dataToSave = {
      ...formData,
      country: "CA", // Always set to Canada
    };
    onSave(dataToSave);
    onClose();
  };

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
        <div className="px-5 py-6 md:px-8 md:py-8 overflow-y-auto modal-scrollbar">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Update Shipping Address
            </h2>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                placeholder="Enter email (optional)"
              />
            </div>

            {/* Address Line 1 - Auto Complete */}
            <div>
              <PostCanadaAddressAutocomplete
                title="Street address"
                name="address_1"
                value={formData.address_1}
                placeholder="Start typing your street address"
                required
                onChange={handleAddressChange}
                onAddressSelected={handleAddressSelected}
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.address_2}
                onChange={(e) => handleChange("address_2", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                placeholder="Apartment, suite, etc. (optional)"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                placeholder="Enter city"
              />
            </div>

            {/* State, Postcode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white appearance-none cursor-pointer text-base md:text-sm"
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 1rem center",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="" disabled>
                    Select your province
                  </option>
                  <option value="AB">Alberta</option>
                  <option value="BC">British Columbia</option>
                  <option value="MB">Manitoba</option>
                  <option value="NB">New Brunswick</option>
                  <option value="NL">Newfoundland and Labrador</option>
                  <option value="NT">Northwest Territories</option>
                  <option value="NS">Nova Scotia</option>
                  <option value="NU">Nunavut</option>
                  <option value="ON">Ontario</option>
                  <option value="PE">Prince Edward Island</option>
                  <option value="QC">Quebec</option>
                  <option value="SK">Saskatchewan</option>
                  <option value="YT">Yukon Territory</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => handleChange("postcode", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                  placeholder="Enter postal code"
                />
              </div>
            </div>

            {/* Country - Fixed to Canada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value="Canada"
                disabled
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6">
            <CustomButton
              text="Save Changes"
              onClick={handleSave}
              variant="default"
              size="medium"
              width="full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
