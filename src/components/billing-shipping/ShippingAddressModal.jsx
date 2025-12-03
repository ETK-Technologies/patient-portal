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
    address_1: "",
    address_2: "",
    city: "",
    postcode: "",
    country: "CA",
    state: "",
    use_as_default: false,
  });

  // Handle mount/unmount animation
  useEffect(() => {
    let visibilityTimeoutId;
    let unmountTimeoutId;

    if (isOpen) {
      setIsMounted(true);
      // Start with modal off-screen (translate-y-full)
      setIsVisible(false);
      // Then animate it in after a brief delay to ensure initial state is applied
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

  // Update form data when modal opens or shippingData changes
  useEffect(() => {
    if (isOpen && shippingData) {
      setFormData({
        id: shippingData.id || null, // shipping_address_id
        address_1: shippingData.address_1 || "",
        address_2: shippingData.address_2 || "",
        city: shippingData.city || "",
        postcode: shippingData.postcode || "",
        country: "CA", // Fixed to Canada
        state: shippingData.state || "",
        use_as_default: false,
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

  const handleCheckboxChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      use_as_default: e.target.checked,
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

  // Check if form is valid (all required fields filled)
  const isFormValid =
    formData.address_1 && formData.city && formData.state && formData.postcode;

  const handleSave = () => {
    if (!isFormValid) {
      return;
    }
    console.log("[SHIPPING_ADDRESS_MODAL] Saving shipping address:", formData);
    // Ensure country is always "CA" when saving
    const dataToSave = {
      ...formData,
      country: "CA", // Always set to Canada
      use_as_default: formData.use_as_default,
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
        <div className="p-5 overflow-y-auto modal-scrollbar">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Update Shipping Address
            </h2>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Address Line 1 */}
            <div>
              <PostCanadaAddressAutocomplete
                title="Address line 1"
                name="address_1"
                value={formData.address_1}
                placeholder="Address line 1"
                required
                onChange={handleAddressChange}
                onAddressSelected={handleAddressSelected}
              />
            </div>

            {/* Address Line 2 */}
            <div className="relative">
              <input
                type="text"
                value={formData.address_2}
                onChange={(e) => handleChange("address_2", e.target.value)}
                className="w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
              <label className="absolute top-2 left-4 text-xs text-gray-500 pointer-events-none">
                Address Line 2
              </label>
            </div>

            {/* City, Province, Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
                <label className="absolute top-2 left-4 text-xs text-gray-500 pointer-events-none">
                  City
                </label>
              </div>
              <div className="relative">
                <select
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white appearance-none cursor-pointer"
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
                    Select province
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
                <label className="absolute top-2 left-4 text-xs text-gray-500 pointer-events-none">
                  Province
                </label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => handleChange("postcode", e.target.value)}
                  className="w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
                <label className="absolute top-2 left-4 text-xs text-gray-500 pointer-events-none">
                  Postal code
                </label>
              </div>
            </div>

            {/* Checkbox for default address */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="use_as_default"
                checked={formData.use_as_default}
                onChange={handleCheckboxChange}
                className="mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900 cursor-pointer"
              />
              <label
                htmlFor="use_as_default"
                className="font-medium text-base leading-[140%] tracking-[0px] align-middle cursor-pointer"
              >
                Use as my default shipping address — also saved in profile
                settings.
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={!isFormValid}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                isFormValid
                  ? "bg-black text-white hover:bg-gray-800 cursor-pointer"
                  : "bg-[#00000033] text-white hover:bg-gray-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
