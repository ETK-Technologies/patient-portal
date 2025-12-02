"use client";

import CustomImage from "@/components/utils/CustomImage";

export default function ProductCard({ product, onClick }) {
  // Handle image array or single image
  const productImage = Array.isArray(product.image)
    ? product.image[0]
    : product.image;

  if (product.price && product.price !== "Varies") {
    // Return card with price (wellness and merchandise products)
    return (
      <div>
        <div
          onClick={onClick}
          className="bg-[#E3E3E3] rounded-[16px] shadow-[0px_0px_16px_0px_#00000014] w-[140px] h-[140px] flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow duration-200"
        >
          <div className="w-full h-full rounded-[16px] overflow-hidden relative flex items-center justify-center">
            <CustomImage src={productImage} alt={product.name} fill />
          </div>
        </div>
        <div className="text-start pt-2">
          <h3 className="text-[14px] font-[500] pb-1 max-w-[140px] break-words">
            {product.name}
          </h3>
          <p className="text-sm font-medium text-gray-900">{product.price}</p>
        </div>
      </div>
    );
  } else {
    // Return card without price (medications or variable products)
    return (
      <div
        onClick={onClick}
        className="bg-[#E3E3E3] rounded-[16px] shadow-[0px_0px_16px_0px_#00000014] w-[140px] h-[184px] flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow duration-200"
      >
        <div className="w-full h-[140px] rounded-[16px] overflow-hidden relative flex items-center justify-center">
          <CustomImage src={productImage} alt={product.name} fill />
        </div>
        <div className="text-start px-4 pt-2">
          <h3 className="text-[14px] font-[500] max-w-[140px] break-words">
            {product.name}
          </h3>
        </div>
      </div>
    );
  }
}
