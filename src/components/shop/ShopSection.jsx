"use client";

import { useState, useEffect } from "react";
import ProductSection from "./ProductSection";
import MerchProductModal from "./MerchProductModal";
import SimpleProductModal from "./SimpleProductModal";
import ProductCardSkeleton from "@/components/utils/skeletons/ProductCardSkeleton";
import { shopData } from "./shopData";
import { transformProductsArray } from "./utils/productTransformer";

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
        const productIds = [592501, 567280, 353755]; // Hoodie, Tee, Cap

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
          // Transform products to our format
          const transformedProducts = transformProductsArray(
            validProducts,
            true
          );

          // Format for ShopBanner: ensure price is numeric and image is string
          const formattedForShopBanner = transformedProducts.map((product) => {
            const numericPrice =
              typeof product.price === "number"
                ? product.price
                : product.priceDisplay
                ? parseFloat(
                    product.priceDisplay.replace("$", "").replace(",", "")
                  )
                : null;

            // Format price display with $ if we have a numeric price
            const displayPrice = numericPrice
              ? `$${numericPrice.toFixed(2)}`
              : product.priceDisplay || "Varies";

            return {
              ...product,
              // Use formatted price with $ for display (ProductCard uses this)
              price: displayPrice,
              // Keep numeric price for calculations (ShopBanner might use this)
              priceNumeric: numericPrice,
              // Ensure image is string (ShopBanner expects single image URL)
              image: Array.isArray(product.image)
                ? product.image[0]
                : product.image || product.images?.[0] || "",
            };
          });

          setMerchandiseProducts(formattedForShopBanner);
        } else {
          // Fallback to static merchandise data if API fails
          console.warn(
            "WooCommerce API unavailable, using static merchandise data"
          );

          // Format static data for ShopBanner
          const formattedStatic = shopData.merchandise.map((product) => {
            const numericPrice =
              product.price && product.price !== "Varies"
                ? parseFloat(product.price.replace("$", "").replace(",", ""))
                : null;

            // Ensure price has $ if it's not "Varies"
            const displayPrice = numericPrice
              ? `$${numericPrice.toFixed(2)}`
              : product.price || "Varies";

            return {
              ...product,
              price: displayPrice, // Use formatted price with $
              image: Array.isArray(product.image)
                ? product.image[0]
                : product.image || "",
            };
          });

          setMerchandiseProducts(formattedStatic);
        }
      } catch (error) {
        console.error("Error fetching merchandise products:", error);
        // Fallback to static merchandise data
        setMerchandiseProducts(shopData.merchandise);
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
            </div>
          </div>
        ) : (
          <ProductSection
            title="Rocky Merch"
            products={merchandiseProducts}
            showScrollIndicator={false}
            onProductClick={handleProductClick}
          />
        )}
      </div>

      {/* Render appropriate modal based on product type */}
      {selectedProduct?.isVariable ? (
        <MerchProductModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          product={selectedProduct}
        />
      ) : (
        <SimpleProductModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          product={selectedProduct}
        />
      )}
    </>
  );
}
