"use client";

import { useState, useEffect } from "react";
import ProductSection from "./ProductSection";
import MerchProductModal from "./MerchProductModal";
import SimpleProductModal from "./SimpleProductModal";
import ProductCardSkeleton from "@/components/utils/skeletons/ProductCardSkeleton";
import { shopData } from "./shopData";
import { transformProductsArray } from "./utils/productTransformer";

// Merchandise product IDs - used to identify merch products for modal selection
const MERCHANDISE_PRODUCT_IDS = [620712, 592501, 567280, 353755]; // Hoodie, Tee, Cap

export default function ShopSection() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [merchandiseProducts, setMerchandiseProducts] = useState([]);
  const [loadingMerchandise, setLoadingMerchandise] = useState(true);

  // Fetch merchandise products dynamically
  useEffect(() => {
    const fetchMerchandiseProducts = async () => {
      try {
        setLoadingMerchandise(true);
        const productIds = MERCHANDISE_PRODUCT_IDS;

        const productPromises = productIds.map(async (id) => {
          try {
            const response = await fetch(`/api/products/id/${id}/full`);
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.warn(
                `Failed to fetch product ${id}:`,
                errorData.error || `Status ${response.status}`
              );
              return null;
            }
            return response.json();
          } catch (error) {
            console.error(
              `Error fetching product ${id}:`,
              error.message || error
            );
            return null;
          }
        });

        const productData = await Promise.all(productPromises);
        const validProducts = productData.filter((product) => product !== null);

        // If we got some products, use them; otherwise fall back to static data
        if (validProducts.length > 0) {
          // Transform products to our format with variations
          const transformedProducts = await transformProductsArray(
            validProducts,
            true
          );

          // Use transformed products directly
          setMerchandiseProducts(transformedProducts);
        } else {
          // No products fetched from API
          console.warn("No merchandise products fetched from WooCommerce API");
          setMerchandiseProducts([]);
        }
      } catch (error) {
        console.error("Error fetching merchandise products:", error);
        // Set empty array on error since we're using dynamic data only
        setMerchandiseProducts([]);
      } finally {
        setLoadingMerchandise(false);
      }
    };

    fetchMerchandiseProducts();
  }, []);

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
        {shopData.medications.length > 0 && (
          <ProductSection
            title="Most popular medications"
            products={shopData.medications}
            showScrollIndicator={true}
            onProductClick={handleProductClick}
          />
        )}

        <ProductSection
          title="Everyday wellness"
          products={shopData.wellness}
          showScrollIndicator={true}
          onProductClick={handleProductClick}
        />

        {loadingMerchandise ? (
          <div className="mb:-[24px] md:mb-[56px]">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-6">
              Rocky Merch
            </h2>
            <div className="flex gap-2 md:gap-4">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </div>
          </div>
        ) : (
          merchandiseProducts.length > 0 && (
            <ProductSection
              title="Rocky Merch"
              products={merchandiseProducts}
              showScrollIndicator={false}
              onProductClick={handleProductClick}
            />
          )
        )}
      </div>

      {/* Render appropriate modal based on product type */}
      {(() => {
        // Check if product is a merchandise product
        const isMerchProduct = selectedProduct?.productId
          ? MERCHANDISE_PRODUCT_IDS.includes(Number(selectedProduct.productId))
          : false;

        // Merchandise products always use MerchProductModal
        if (isMerchProduct) {
          return (
            <MerchProductModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              product={selectedProduct}
            />
          );
        }

        // Other products use SimpleProductModal
        return (
          <SimpleProductModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            product={selectedProduct}
          />
        );
      })()}
    </>
  );
}
