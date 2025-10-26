"use client";

import { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { HiChevronDown } from "react-icons/hi";
import CustomImage from "@/components/utils/CustomImage";
import CustomButton from "@/components/utils/Button";

export default function ProductModal({ isOpen, onClose, product }) {
  const [quantity, setQuantity] = useState(1);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const increaseQuantity = () => setQuantity((q) => q + 1);
  const decreaseQuantity = () => setQuantity((q) => Math.max(1, q - 1));

  const totalPrice = product.price
    ? `$${parseInt(product.price.replace("$", "")) * quantity}`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-t-[16px] md:rounded-[16px] w-full h-[95%] md:w-[760px] md:h-[540px] overflow-hidden flex flex-col ">
        {/* Close Button */}
        <CustomButton
          onClick={onClose}
          variant="ghost"
          className="absolute top-4 right-4 !p-0 !w-[40px] !h-[40px] z-10 !rounded-full !bg-gray-100 hover:!bg-gray-200 "
        >
          <IoMdClose className="text-[24px] " />
        </CustomButton>

        <div className="flex flex-col md:flex-row gap-0 flex-1 min-h-0">
          {/* Product Image - First on Mobile, Second on Desktop */}
          <div className="w-full md:w-1/2 h-[415px] md:w-[380px] md:h-full relative bg-gray-50 order-1 md:order-2 flex-shrink-0">
            <CustomImage src={product.image} alt={product.name} fill />
          </div>

          {/* Content - Second on Mobile, First on Desktop */}
          <div className="w-full md:w-1/2 order-2 md:order-1 flex flex-col min-h-0">
            {/* Scrollable Content */}
            <div className="flex-1 space-y-6 p-6 overflow-y-auto min-h-0">
              <h2 className="text-2xl font-bold text-gray-900">
                {product.name}
              </h2>
              <p className="text-base text-gray-600">{product.description}</p>
              <p className="text-2xl font-bold text-gray-900">
                {product.price}
              </p>

              {/* Section Headers */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Details</span>
                  <HiChevronDown className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">
                    How to use it
                  </span>
                  <HiChevronDown className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">
                    Ingredients list
                  </span>
                  <HiChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Related Products */}
              <div className="pt-2">
                <h3 className="font-medium text-gray-900 mb-3">
                  Related Products
                </h3>
                <div className="flex gap-3 overflow-x-auto">
                  {product.relatedProducts?.map((id) => (
                    <div
                      key={id}
                      className="w-[100px] h-[100px] bg-[#E3E3E3] rounded-xl flex-shrink-0"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Quantity & Buy Button */}
            <div className="sticky bottom-0 bg-white p-6 border-t border-gray-200 flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <CustomButton
                  text="-"
                  onClick={decreaseQuantity}
                  variant="ghost"
                  size="medium"
                  width="auto"
                  className="!rounded-none !border-0 hover:bg-gray-50"
                />
                <span className="px-6 py-2 text-gray-900 font-medium border-x border-gray-300">
                  {quantity}
                </span>
                <CustomButton
                  text="+"
                  onClick={increaseQuantity}
                  variant="ghost"
                  size="medium"
                  width="auto"
                  className="!rounded-none !border-0 hover:bg-gray-50"
                />
              </div>
              <CustomButton
                text={`Buy Now - ${totalPrice}`}
                variant="default"
                size="large"
                width="auto"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
