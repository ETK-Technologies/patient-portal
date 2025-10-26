"use client";

import { useState } from "react";
import ProductSection from "./ProductSection";
import ProductModal from "./ProductModal";
import { shopData } from "./shopData";

export default function ShopSection() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <>
      <div className="space-y-8">
        <ProductSection
          title="Most popular medications"
          products={shopData.medications}
          showScrollIndicator={true}
          onProductClick={handleProductClick}
        />

        <ProductSection
          title="Everyday wellness"
          products={shopData.wellness}
          showScrollIndicator={true}
          onProductClick={handleProductClick}
        />

        <ProductSection
          title="Rocky Merch"
          products={shopData.merchandise}
          showScrollIndicator={false}
          onProductClick={handleProductClick}
        />
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
      />
    </>
  );
}
