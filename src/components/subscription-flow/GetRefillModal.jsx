"use client";

import { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";

const ANIMATION_DURATION = 300;

export default function GetRefillModal({ isOpen, onClose, onConfirm }) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

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

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
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
            <h2 className="text-xl font-semibold text-gray-900">Get Refill</h2>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-base text-gray-900">
              Once you confirm, we'll charge your card and set up your new
              refill order instantly.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-gray-900 text-gray-900 rounded-full font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Not now
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Get my refill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
