"use client";

import { useRef } from "react";
import ProductCard from "./ProductCard";
import ScrollArrows from "@/components/utils/ScrollArrows";
import ScrollIndicator from "@/components/treatments/ScrollIndicator";

export default function ProductSection({
  title,
  products,
  showScrollIndicator = true,
}) {
  const scrollContainerRef = useRef(null);

  return (
    <div className="mb:-[24px] md:mb-[56px]">
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-6">
        {title}
      </h2>

      <div className="relative">
        {/* Linear gradient overlay */}
        <div className="heddin md:absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

        {/* Scroll arrows */}
        <ScrollArrows containerRef={scrollContainerRef} scrollAmount={160} />

        {/* Products container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-2 md:gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      {showScrollIndicator && (
        <ScrollIndicator
          containerRef={scrollContainerRef}
          totalItems={Math.ceil(products.length / 2)}
        />
      )}
    </div>
  );
}
