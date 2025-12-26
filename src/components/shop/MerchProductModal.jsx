"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Image from "next/image";
import { IoClose, IoChevronUp, IoChevronDown } from "react-icons/io5";
import CustomImage from "@/components/utils/CustomImage";
import { formatPrice } from "@/utils/priceFormatter";

const MerchProductModal = ({ isOpen, onClose, product }) => {
  // Use the product data passed from parent component
  const currentProduct = product;
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState("black");
  const [quantity, setQuantity] = useState(1);
  const MAX_QUANTITY = 10;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openSections, setOpenSections] = useState({
    description: true,
    sizeAndFit: true,
    care: true,
  });
  const previousProductIdRef = useRef(null);

  const isShirt =
    currentProduct?.slug?.includes("rocky-essential-tee") ||
    currentProduct?.name?.toLowerCase().includes("tee") ||
    false;

  // Get product images
  const productImages = useMemo(() => {
    return Array.isArray(product?.image)
      ? product.image
      : product?.images && Array.isArray(product.images)
      ? product.images
      : product?.image
      ? [product.image]
      : [];
  }, [product?.image, product?.images]);

  // Sort sizes from small to XL for better UX
  const sortSizes = (sizes) => {
    const order = [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL",
      "XXXL",
      "One Size",
      "One Size Fits All",
    ];
    return sizes.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  };

  // Get sizes and colors from product data (already transformed)
  const sizes = useMemo(() => {
    if (currentProduct?.sizes && Array.isArray(currentProduct.sizes)) {
      return sortSizes([...currentProduct.sizes]);
    }
    return [];
  }, [currentProduct?.sizes]);

  const sizeChart = currentProduct?.sizeChart || {
    S: 'Chest: 39"',
    M: 'Chest: 42"',
    L: 'Chest: 45"',
    XL: 'Chest: 48"',
  };

  const colors = useMemo(() => {
    if (currentProduct?.colors && Array.isArray(currentProduct.colors)) {
      return currentProduct.colors;
    }
    return [];
  }, [currentProduct?.colors]);

  // Calculate price
  const priceValue =
    typeof product?.price === "number"
      ? product.price
      : product?.price
      ? parseFloat(String(product.price).replace("$", "").replace(",", ""))
      : 0;

  // Reset state when product changes
  useEffect(() => {
    if (isOpen && currentProduct) {
      document.body.style.overflow = "hidden";

      if (previousProductIdRef.current !== currentProduct?.id) {
        setTimeout(() => {
          setQuantity(1);
          setSelectedImageIndex(0);
          setSelectedSize(null);

          // Update selected color when product changes
          if (currentProduct?.colors?.length > 0) {
            setSelectedColor(
              currentProduct.colors[0].name || currentProduct.colors[0]
            );
          } else if (colors.length > 0) {
            setSelectedColor(colors[0].name || colors[0]);
          } else {
            setSelectedColor("black");
          }

          setOpenSections({
            description: true,
            sizeAndFit: true,
            care: true,
          });
        }, 0);
        previousProductIdRef.current = currentProduct?.id;
      }
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, currentProduct, colors]);

  // Get variations from product variationData (already fetched during transformation)
  const variations = useMemo(() => {
    if (currentProduct?.variationData?.variationDetails) {
      return Object.values(currentProduct.variationData.variationDetails);
    }
    return [];
  }, [currentProduct?.variationData]);

  // Helper function to normalize size for comparison
  const normalizeSize = useCallback((size) => {
    if (!size) return "";
    // Convert to string, lowercase, remove spaces and dashes
    let normalized = String(size)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "")
      .replace(/-/g, "");

    // Handle common size abbreviations
    const sizeMap = {
      xs: "xs",
      s: "s",
      small: "s",
      m: "m",
      medium: "m",
      l: "l",
      large: "l",
      xl: "xl",
      extralarge: "xl",
      "extra large": "xl",
      xxl: "xxl",
      xxxl: "xxxl",
      onesize: "onesize",
      "one size": "onesize",
      "one size fits all": "onesize",
    };

    return sizeMap[normalized] || normalized;
  }, []);

  // Helper function to find variation by size and color
  const findVariationBySizeAndColor = useCallback(
    (size, color) => {
      if (!variations || variations.length === 0) return null;

      const normalizedSize = normalizeSize(size);

      return variations.find((variation) => {
        const attrs = variation.attributes || [];

        // Check for size match - attributes is now an array
        const hasSize = attrs.some((attr) => {
          if (attr.name?.toLowerCase().includes("size")) {
            const normalizedValue = normalizeSize(attr.option);
            return normalizedValue === normalizedSize;
          }
          return false;
        });

        // Check for color match (only if product has colors)
        let hasColor = true; // Default to true if no colors
        if (colors.length > 0) {
          hasColor = attrs.some((attr) => {
            if (attr.name?.toLowerCase().includes("color")) {
              const normalizedValue = String(attr.option).toLowerCase().trim();
              const normalizedColor = String(color).toLowerCase().trim();
              return normalizedValue === normalizedColor;
            }
            return false;
          });
        }

        // If product has color attribute, both must match
        // If product doesn't have color, only size needs to match
        if (colors.length > 0) {
          return hasSize && hasColor;
        }
        return hasSize;
      });
    },
    [variations, colors, normalizeSize]
  );

  // Helper function to get variation info for a specific size
  const getVariationInfoForSize = useCallback(
    (size) => {
      if (!size) return null;
      const normalizedSize = normalizeSize(size);

      // If no colors, just match by size
      if (colors.length === 0) {
        if (!variations || variations.length === 0) return null;
        return variations.find((variation) => {
          const attrs = variation.attributes || [];
          return attrs.some((attr) => {
            if (attr.name?.toLowerCase().includes("size")) {
              const normalizedValue = normalizeSize(attr.option);
              return normalizedValue === normalizedSize;
            }
            return false;
          });
        });
      }
      // If colors exist, require selectedColor
      if (!selectedColor) return null;
      return findVariationBySizeAndColor(size, selectedColor);
    },
    [
      selectedColor,
      findVariationBySizeAndColor,
      colors,
      variations,
      normalizeSize,
    ]
  );

  // Auto-select size if only one size is available
  useEffect(() => {
    if (currentProduct?.sizes?.length === 1) {
      setSelectedSize(currentProduct.sizes[0]);
    } else {
      setSelectedSize(null); // Reset size selection for multiple sizes
    }
  }, [currentProduct]);

  // Reset selected size if it becomes sold out when color changes
  useEffect(() => {
    if (selectedSize && selectedColor) {
      const variationInfo = getVariationInfoForSize(selectedSize);
      if (variationInfo && variationInfo.stock_status === "outofstock") {
        setSelectedSize(null);
      }
    }
  }, [selectedColor, selectedSize, getVariationInfoForSize]);

  // Swipe functionality for image navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchEnd(null);
    setTouchStart(touch.clientX);
  };

  const onTouchMove = (e) => {
    const touch = e.touches[0];
    setTouchEnd(touch.clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || productImages.length <= 1) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setSelectedImageIndex((prev) =>
        prev === productImages.length - 1 ? 0 : prev + 1
      );
    }

    if (isRightSwipe) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? productImages.length - 1 : prev - 1
      );
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const scrollToSizeAndFit = () => {
    if (!openSections.sizeAndFit) {
      setOpenSections((prev) => ({
        ...prev,
        sizeAndFit: true,
      }));
    }

    setTimeout(() => {
      const sizeAndFitElement = document.querySelector(
        '[data-section="sizeAndFit"]'
      );
      if (sizeAndFitElement) {
        sizeAndFitElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const handleBuyNow = async () => {
    if (!currentProduct) return;

    // For variable products, require size selection
    if (currentProduct.isVariable || currentProduct.type === "variable") {
      if (!selectedSize) {
        alert("Please select a size");
        return;
      }

      // Check if the selected size is sold out
      const variationInfo = getVariationInfoForSize(selectedSize);
      if (variationInfo && variationInfo.stock_status === "outofstock") {
        alert("This size is currently sold out.");
        return;
      }

      // Only require color if the product has color options
      if (colors.length > 0 && !selectedColor) {
        alert("Please select a color");
        return;
      }
    }

    setIsProcessing(true);

    try {
      let productId = currentProduct.id || currentProduct.productId;
      let variationId = null;

      // For variable products, find the variation ID
      if (
        (currentProduct.isVariable || currentProduct.type === "variable") &&
        currentProduct.variations &&
        currentProduct.variations.length > 0
      ) {
        if (!selectedSize) {
          alert("Please select a size before adding to cart.");
          setIsProcessing(false);
          return;
        }

        // Try to find variation using variationData
        const variationInfo = getVariationInfoForSize(selectedSize);
        if (variationInfo) {
          variationId =
            variationInfo.id ||
            variationInfo.variation_id ||
            variationInfo.variationId;
        }

        // Fallback: Try to find variation by matching size index with variations array
        if (!variationId && currentProduct.sizes) {
          const sizeIndex = currentProduct.sizes.indexOf(selectedSize);
          if (sizeIndex !== -1 && currentProduct.variations[sizeIndex]) {
            variationId = currentProduct.variations[sizeIndex];
          }
        }

        // If still no variation ID found, try to get first matching variation from variationDetails
        if (!variationId && currentProduct.variationData?.variationDetails) {
          const allVariations = Object.values(
            currentProduct.variationData.variationDetails
          );
          const normalizedSelectedSize = normalizeSize(selectedSize);
          const matchingVariation = allVariations.find((variation) => {
            const attrs = variation.attributes || [];
            return attrs.some((attr) => {
              if (attr.name?.toLowerCase().includes("size")) {
                const normalizedAttrSize = normalizeSize(attr.option);
                return normalizedAttrSize === normalizedSelectedSize;
              }
              return false;
            });
          });
          if (matchingVariation) {
            variationId =
              matchingVariation.id ||
              matchingVariation.variation_id ||
              matchingVariation.variationId;
          }
        }
      }

      const productIdForUrl = variationId || productId;

      // Reset state before closing
      setQuantity(1);
      setSelectedSize(null);
      if (colors.length > 0) {
        setSelectedColor(colors[0].name || colors[0] || "black");
      } else {
        setSelectedColor("black");
      }
      setSelectedImageIndex(0);
      setOpenSections({
        description: true,
        sizeAndFit: true,
        care: true,
      });

      // Close modal
      onClose();

      const baseUrl =
        process.env.NEXT_PUBLIC_ROCKY_API_URL ||
        "https://rocky-headless-git-staging-rocky-health.vercel.app";
      const checkoutUrl = `${baseUrl}/checkout?onboarding-add-to-cart=${productIdForUrl}`;

      console.log("[MerchProductModal] Redirecting to checkout:", checkoutUrl);

      window.open(checkoutUrl, "_blank");
    } catch (error) {
      console.error("Error redirecting to checkout:", error);
      alert(
        error.message || "There was an error redirecting to checkout. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !currentProduct) return null;

  // Check if selected size is sold out
  const selectedSizeVariationInfo = selectedSize
    ? getVariationInfoForSize(selectedSize)
    : null;
  const isSelectedSizeSoldOut =
    selectedSizeVariationInfo &&
    selectedSizeVariationInfo.stock_status === "outofstock";

  // For variable products, require size selection. For simple products, size is optional
  const isVariable =
    currentProduct?.isVariable || currentProduct?.type === "variable";
  const canBuyNow = isVariable
    ? selectedSize &&
      !isSelectedSizeSoldOut &&
      (!colors.length || selectedColor)
    : !isSelectedSizeSoldOut && (!colors.length || selectedColor);

  // Calculate total price dynamically from variation if available
  const totalPrice = useMemo(() => {
    if (selectedSize) {
      const variationInfo = getVariationInfoForSize(selectedSize);
      if (variationInfo) {
        const variationPrice =
          variationInfo.price || variationInfo.regular_price || 0;
        return variationPrice * quantity;
      }
    }
    // Fallback to product price
    return priceValue > 0 ? priceValue * quantity : 0;
  }, [selectedSize, selectedColor, quantity, priceValue, variations]);

  return (
    <>
      <style jsx global>{`
        body {
          overflow: hidden !important;
        }
        html {
          overflow: hidden !important;
        }
      `}</style>
      <div className="fixed inset-0 z-9999 flex items-center justify-center overflow-hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 cursor-pointer"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-3xl lg:rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden lg:max-w-[800px] lg:max-h-[570px]">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute text-normal top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors z-10 cursor-pointer"
          >
            <IoClose className="w-6 h-6 text-black" />
          </button>

          {/* Mobile Layout */}
          <div className="flex flex-col lg:flex-row-reverse h-full">
            {/* Product Images - Top on mobile, Right on desktop */}
            <div className="lg:w-96">
              <div className="relative">
                {/* Main Product Image */}
                <div
                  className="relative w-full h-[300px] lg:h-[462px] rounded-t-2xl mb-2 bg-[#F3F3F3] lg:mb-0 flex items-center justify-center lg:p-0"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  style={{ touchAction: "pan-x" }}
                >
                  <div className="relative w-[80%] h-[80%] md:w-[75%] md:h-[75%]">
                    {productImages[selectedImageIndex] && (
                      <Image
                        src={productImages[selectedImageIndex]}
                        alt={currentProduct.name}
                        fill
                        className="object-contain object-center"
                      />
                    )}
                  </div>

                  {/* Navigation arrows - Desktop only */}
                  {productImages.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev === 0 ? productImages.length - 1 : prev - 1
                          )
                        }
                        className="hidden lg:flex absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-90 rounded-full items-center justify-center shadow-lg hover:bg-opacity-100 transition-all duration-200 hover:scale-110 cursor-pointer"
                      >
                        <svg
                          className="w-5 h-5 text-black"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>

                      <button
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev === productImages.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="hidden lg:flex absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-90 rounded-full items-center justify-center shadow-lg hover:bg-opacity-100 transition-all duration-200 hover:scale-110 cursor-pointer"
                      >
                        <svg
                          className="w-5 h-5 text-black"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Images */}
                {productImages.length > 1 && (
                  <div className="flex justify-center gap-[10px] md:bg-[#F3F3F3] md:py-6 md:rounded-b-2xl">
                    {productImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-12 h-12 md:w-[60px] md:h-[60px] rounded-2xl overflow-hidden border-2 transition-colors p-2 cursor-pointer ${
                          selectedImageIndex === index
                            ? "border-gray-900"
                            : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <CustomImage
                          src={image}
                          alt={`${currentProduct.name} view ${index + 1}`}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Information - Scrollable content */}
            <div className="flex-1 px-5 py-4 lg:p-8 overflow-y-auto relative">
              {/* Product Name */}
              <h2 className="text-[20px] md:text-[24px] font-medium text-black mb-2 tracking-[0%] leading-[140%]">
                {currentProduct.name}
              </h2>

              {/* Product Description */}
              <p className="text-black text-sm lg:text-base tracking-[-1%] leading-[140%] mb-2">
                {currentProduct?.short_description ||
                  currentProduct?.description ||
                  ""}
              </p>

              {/* Color Selection - Only for variable products with colors */}
              {colors.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-base md:text-lg font-medium text-black tracking-[0%] leading-[140%]">
                      Color:{" "}
                      {selectedColor.charAt(0).toUpperCase() +
                        selectedColor.slice(1)}
                    </span>
                    <div
                      className="w-12 h-12 rounded-full border-2 border-white shadow-[0_0_0_1px_black]"
                      style={{
                        backgroundColor:
                          colors.find((c) => c.name === selectedColor)?.value ||
                          "#CCCCCC",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {sizes.length > 0 && (
                <div className="mb-4 lg:mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base md:text-lg font-medium text-black tracking-[0%] leading-[140%]">
                      Select Size:
                    </span>
                    <button
                      onClick={scrollToSizeAndFit}
                      className="text-sm md:text-base text-black underline tracking-[0%] leading-[140%] hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      Size Guide
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {sizes.map((size) => {
                      const variationInfo = getVariationInfoForSize(size);
                      const isSoldOut =
                        variationInfo &&
                        variationInfo.stock_status === "outofstock";
                      const isDisabled = isProcessing || isSoldOut;

                      return (
                        <button
                          key={size}
                          onClick={() => {
                            if (isSoldOut) {
                              // Optionally handle sold out size click (e.g., show notify popup)
                              return;
                            } else {
                              setSelectedSize(size);
                            }
                          }}
                          disabled={isProcessing}
                          className={`relative px-3 lg:px-4 py-2 h-12 border rounded-lg text-base font-medium transition-colors ${
                            size === "One Size" || size === "One Size Fits All"
                              ? "min-w-fit"
                              : "w-12"
                          } ${
                            selectedSize === size
                              ? "border-gray-900 bg-white text-black cursor-pointer"
                              : isSoldOut
                              ? "border-gray-300 bg-gray-100 text-gray-400 cursor-pointer hover:bg-gray-200"
                              : "border-gray-300 bg-white text-black hover:border-gray-400 cursor-pointer"
                          } ${
                            isProcessing ? "cursor-not-allowed opacity-50" : ""
                          }`}
                        >
                          <span className={isSoldOut ? "line-through" : ""}>
                            {size}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Accordion Sections */}
              <div className="space-y-4">
                <div className="border-b border-gray-200 text-black text-lg font-medium leading-[140%] tracking-[0%] pb-4">
                  Details
                </div>

                {/* Description */}
                {(currentProduct?.description ||
                  currentProduct?.details?.description) && (
                  <div className="border-b border-gray-200">
                    <button
                      onClick={() => toggleSection("description")}
                      className="flex items-center justify-between w-full py-3 text-left cursor-pointer"
                    >
                      <span className="font-medium text-gray-900">
                        Description
                      </span>
                      {openSections.description ? (
                        <IoChevronUp className="w-5 h-5" />
                      ) : (
                        <IoChevronDown className="w-5 h-5" />
                      )}
                    </button>
                    {openSections.description && (
                      <div className="pb-3 text-sm text-[#000000CC]">
                        {currentProduct?.detailedDescription ||
                          currentProduct?.details?.description ||
                          currentProduct?.description}
                      </div>
                    )}
                  </div>
                )}

                {/* Size and Fit */}
                <div
                  className="border-b border-gray-200"
                  data-section="sizeAndFit"
                >
                  <button
                    onClick={() => toggleSection("sizeAndFit")}
                    className="flex items-center justify-between w-full py-3 text-left cursor-pointer"
                  >
                    <span className="font-medium text-gray-900">
                      Size and Fit
                    </span>
                    {openSections.sizeAndFit ? (
                      <IoChevronUp className="w-5 h-5" />
                    ) : (
                      <IoChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  {openSections.sizeAndFit && (
                    <div className="pb-4 text-[#000000CC] text-sm">
                      <p className="mb-6">
                        Fit: {currentProduct?.fit || "true to size"}
                      </p>
                      {isShirt && (
                        <p className="mb-4">
                          Model is 5&apos;9 160lbs (175cm / 72kg) and is wearing
                          a size Medium.
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-6">
                          {Object.entries(sizeChart)
                            .slice(0, 2)
                            .map(([size, measurement]) => (
                              <div key={size} className="flex flex-col">
                                <span className="font-medium text-black">
                                  {size}
                                </span>
                                <span className="text-[#000000CC]">
                                  {measurement}
                                </span>
                              </div>
                            ))}
                        </div>
                        <div className="space-y-6">
                          {Object.entries(sizeChart)
                            .slice(2)
                            .map(([size, measurement]) => (
                              <div key={size} className="flex flex-col">
                                <span className="font-medium text-black">
                                  {size}
                                </span>
                                <span className="text-[#000000CC]">
                                  {measurement}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Care */}
                <div className="">
                  <button
                    onClick={() => toggleSection("care")}
                    className="flex items-center justify-between w-full py-3 text-left cursor-pointer"
                  >
                    <span className="font-medium text-gray-900">Care</span>
                    {openSections.care ? (
                      <IoChevronUp className="w-5 h-5" />
                    ) : (
                      <IoChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  {openSections.care && (
                    <div className="pb-3 text-[#000000CC] text-sm">
                      <p>
                        We recommend machine washing in cold water and air
                        drying to maintain integrity. For hats, hand wash gently
                        and air dry.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Spacer for fixed button on mobile */}
              <div className="h-20 lg:hidden"></div>

              {/* Desktop Buy Now Button - Sticky at bottom */}
              <div
                className="hidden lg:block sticky bottom-0 bg-white -mx-8"
                style={{
                  marginBottom: "-32px",
                  paddingBottom: "32px",
                  background:
                    "linear-gradient(180deg, rgba(255, 255, 255, 0.00) 0%, #FFF 26.5%)",
                }}
              >
                <div
                  className="flex items-center justify-center gap-4 w-full px-8 py-8 bg-white -mb-16"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255, 255, 255, 0.00) 0%, #FFF 26.5%)",
                  }}
                >
                  <div className="flex items-center justify-between h-[52px] w-[100px] p-4 border border-gray-300 rounded-full">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={
                        (isVariable && !selectedSize) ||
                        isProcessing ||
                        isSelectedSizeSoldOut ||
                        quantity <= 1
                      }
                      className={`flex items-center justify-center w-4 h-4 text-lg text-center ${
                        (!isVariable || selectedSize) &&
                        !isProcessing &&
                        !isSelectedSizeSoldOut &&
                        quantity > 1
                          ? "text-gray-600 hover:text-gray-800 cursor-pointer"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      -
                    </button>
                    <span className="text-base text-center flex items-center justify-center text-gray-900 font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(Math.min(quantity + 1, MAX_QUANTITY))
                      }
                      disabled={
                        (isVariable && !selectedSize) ||
                        isProcessing ||
                        isSelectedSizeSoldOut ||
                        quantity >= MAX_QUANTITY
                      }
                      className={`flex items-center justify-center w-4 h-4 text-lg text-center ${
                        (!isVariable || selectedSize) &&
                        !isProcessing &&
                        !isSelectedSizeSoldOut &&
                        quantity < MAX_QUANTITY
                          ? "text-gray-600 hover:text-gray-800 cursor-pointer"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleBuyNow}
                    disabled={
                      (isVariable && !selectedSize) ||
                      isProcessing ||
                      isSelectedSizeSoldOut ||
                      !currentProduct.productId
                    }
                    className={`flex-1 h-[52px] w-[222px] py-3 rounded-full font-medium ${
                      (!isVariable || selectedSize) &&
                      !isProcessing &&
                      !isSelectedSizeSoldOut &&
                      currentProduct.productId
                        ? "bg-black text-white hover:bg-gray-800 cursor-pointer"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isProcessing
                      ? "Processing..."
                      : `Buy Now${
                          totalPrice > 0 ? ` - $${formatPrice(totalPrice)}` : ""
                        }`}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Buy Now Button - Mobile only */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-full">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={
                    (isVariable && !selectedSize) ||
                    isProcessing ||
                    isSelectedSizeSoldOut ||
                    quantity <= 1
                  }
                  className={`px-3 py-2 ${
                    (!isVariable || selectedSize) &&
                    !isProcessing &&
                    !isSelectedSizeSoldOut &&
                    quantity > 1
                      ? "text-gray-600 hover:text-gray-800 cursor-pointer"
                      : "text-gray-300 cursor-not-allowed"
                  }`}
                >
                  -
                </button>
                <span className="px-4 py-2 text-gray-900 font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(quantity + 1, MAX_QUANTITY))
                  }
                  disabled={
                    (isVariable && !selectedSize) ||
                    isProcessing ||
                    isSelectedSizeSoldOut ||
                    quantity >= MAX_QUANTITY
                  }
                  className={`px-3 py-2 ${
                    (!isVariable || selectedSize) &&
                    !isProcessing &&
                    !isSelectedSizeSoldOut &&
                    quantity < MAX_QUANTITY
                      ? "text-gray-600 hover:text-gray-800 cursor-pointer"
                      : "text-gray-300 cursor-not-allowed"
                  }`}
                >
                  +
                </button>
              </div>
              <button
                onClick={handleBuyNow}
                disabled={
                  (isVariable && !selectedSize) ||
                  isProcessing ||
                  isSelectedSizeSoldOut ||
                  !currentProduct.productId
                }
                className={`flex-1 py-3 px-6 rounded-full font-medium sm:text-base text-sm ${
                  (!isVariable || selectedSize) &&
                  !isProcessing &&
                  !isSelectedSizeSoldOut &&
                  currentProduct.productId
                    ? "bg-black text-white hover:bg-gray-800 cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isProcessing
                  ? "Processing..."
                  : `Buy Now${
                      totalPrice > 0 ? ` - $${formatPrice(totalPrice)}` : ""
                    }`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MerchProductModal;
