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
import { handleCheckout } from "@/utils/checkout";
import { formatPrice } from "@/utils/priceFormatter";

const HOODIE_PRODUCT_ID = "592501";
const HOODIE_VARIATION_ID_MAP = {
  s: "592618", // Small
  m: "592519", // Medium
  l: "592518", // Large
  xl: "592520", // XL
};

const TEE_PRODUCT_ID = "567280";
const TEE_VARIATION_ID_MAP = {
  s: "567884", // Small
  l: "567883", // Large
};

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
  const [variations, setVariations] = useState([]);
  const [loadingVariations, setLoadingVariations] = useState(false);

  const isShirt =
    currentProduct?.slug?.includes("rocky-essential-tee") || false;
  const isHoodieProduct = currentProduct?.productId === HOODIE_PRODUCT_ID;
  const isTeeProduct = currentProduct?.productId === TEE_PRODUCT_ID;

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

  // Get sizes and colors from product attributes (for variable products)
  const sizes = useMemo(() => {
    const rawSizes =
      currentProduct?.attributes?.find((attr) =>
        attr.name.toLowerCase().includes("size")
      )?.options ||
      currentProduct?.sizes ||
      [];
    return sortSizes([...rawSizes]);
  }, [currentProduct?.attributes, currentProduct?.sizes]);

  const sizeChart = currentProduct?.sizeChart || {
    S: 'Chest: 39"',
    M: 'Chest: 42"',
    L: 'Chest: 45"',
    XL: 'Chest: 48"',
  };

  const colors = useMemo(() => {
    return (
      currentProduct?.colors || [
        { name: "black", value: "#000000" },
        { name: "white", value: "#FFFFFF" },
        { name: "green", value: "#2D5016" },
      ]
    );
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
            setSelectedColor(currentProduct.colors[0].name);
          } else if (colors.length > 0) {
            setSelectedColor(colors[0].name);
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

  // Fetch variations for variable products
  useEffect(() => {
    const fetchVariations = async () => {
      if (!currentProduct?.isVariable || !currentProduct?.productId) {
        setVariations([]);
        return;
      }

      setLoadingVariations(true);
      try {
        const response = await fetch(
          `/api/products/debug?id=${currentProduct.productId}`
        );
        if (response.ok) {
          const data = await response.json();
          setVariations(data.formatted_variations || []);
        } else {
          console.warn("Failed to fetch variations");
          setVariations([]);
        }
      } catch (error) {
        console.error("Error fetching variations:", error);
        setVariations([]);
      } finally {
        setLoadingVariations(false);
      }
    };

    if (isOpen && currentProduct?.isVariable) {
      fetchVariations();
    }
  }, [isOpen, currentProduct?.productId, currentProduct?.isVariable]);

  // Helper function to find variation by size and color
  const findVariationBySizeAndColor = useCallback(
    (size, color) => {
      if (!variations || variations.length === 0) return null;

      return variations.find((variation) => {
        const attrs = variation.attributes || {};
        const hasSize = Object.entries(attrs).some(([key, value]) => {
          if (key.toLowerCase().includes("size")) {
            return value.toLowerCase() === size.toLowerCase();
          }
          return false;
        });
        const hasColor = Object.entries(attrs).some(([key, value]) => {
          if (key.toLowerCase().includes("color")) {
            return value.toLowerCase() === color.toLowerCase();
          }
          return false;
        });

        // If product has color attribute, both must match
        // If product doesn't have color, only size needs to match
        if (colors.length > 0) {
          return hasSize && hasColor;
        }
        return hasSize;
      });
    },
    [variations, colors]
  );

  // Helper function to get variation info for a specific size
  const getVariationInfoForSize = useCallback(
    (size) => {
      if (!selectedColor || !size) return null;
      return findVariationBySizeAndColor(size, selectedColor);
    },
    [selectedColor, findVariationBySizeAndColor]
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
    if (selectedSize && selectedColor && variations.length > 0) {
      const variationInfo = getVariationInfoForSize(selectedSize);
      if (variationInfo && variationInfo.stock_status === "outofstock") {
        setSelectedSize(null);
      }
    }
  }, [selectedColor, selectedSize, variations, getVariationInfoForSize]);

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

  const handleBuyNow = () => {
    // For variable products, require size selection
    if (currentProduct.isVariable) {
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
      // Tee (567280) requires color, Hoodie (592501) doesn't have color attribute
      if (colors.length > 0 && !selectedColor) {
        alert("Please select a color");
        return;
      }
    }

    if (!currentProduct.productId) {
      return;
    }

    setIsProcessing(true);

    try {
      const cartItem = {
        productId: currentProduct.productId,
        quantity: quantity,
      };

      // For variable products, add size (required) and color (if product has colors)
      if (currentProduct.isVariable) {
        if (!selectedSize) {
          alert("Please select a size before proceeding to checkout.");
          setIsProcessing(false);
          return;
        }

        // Check stock status again before proceeding
        const variationInfo = getVariationInfoForSize(selectedSize);
        if (variationInfo && variationInfo.stock_status === "outofstock") {
          alert("This size is currently sold out.");
          setIsProcessing(false);
          return;
        }

        const normalizedSize = selectedSize.toLowerCase().trim();
        if (isHoodieProduct || isTeeProduct) {
          const fallbackMap = isHoodieProduct
            ? HOODIE_VARIATION_ID_MAP
            : TEE_VARIATION_ID_MAP;

          const resolvedVariationId =
            (variationInfo?.id && String(variationInfo.id)) ||
            fallbackMap[normalizedSize];

          if (!resolvedVariationId) {
            alert(
              "Unable to find the selected product variation. Please try again."
            );
            setIsProcessing(false);
            return;
          }

          cartItem.productId = resolvedVariationId;
        }

        // CRITICAL: Normalize size to lowercase
        // WooCommerce default_attributes use lowercase (e.g., "m", "l", "s", "xl")
        cartItem.size = normalizedSize;

        // Color handling:
        // - Only add color if product has color options AND one is selected
        // - Hoodie (592501) doesn't have Color attribute, so colors.length will be 0
        // - Tee (567280) has Color attribute, so colors.length > 0 and selectedColor is required
        if (colors.length > 0) {
          if (!selectedColor) {
            alert("Please select a color before proceeding to checkout.");
            setIsProcessing(false);
            return;
          }
          // Normalize color to lowercase (WooCommerce default_attributes use lowercase)
          cartItem.color = selectedColor.toLowerCase().trim();
        }
        // If colors.length === 0 (like Hoodie), we don't add color to cartItem
      }

      console.log("[MerchProductModal] Cart item being sent:", cartItem);
      handleCheckout([cartItem], true);
      onClose();
    } catch (error) {
      console.error("Error processing checkout:", error);
      alert("There was an error processing your checkout. Please try again.");
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

  const canBuyNow =
    selectedSize && !isSelectedSizeSoldOut && (!colors.length || selectedColor);
  const totalPrice = priceValue > 0 ? priceValue * quantity : 0;

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
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden z-[9999]">
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

                      return (
                        <button
                          key={size}
                          onClick={() => {
                            if (isSoldOut) {
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
                        !selectedSize ||
                        isProcessing ||
                        isSelectedSizeSoldOut ||
                        quantity <= 1
                      }
                      className={`flex items-center justify-center w-4 h-4 text-lg text-center ${
                        selectedSize &&
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
                        !selectedSize ||
                        isProcessing ||
                        isSelectedSizeSoldOut ||
                        quantity >= MAX_QUANTITY
                      }
                      className={`flex items-center justify-center w-4 h-4 text-lg text-center ${
                        selectedSize &&
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
                      !selectedSize ||
                      isProcessing ||
                      isSelectedSizeSoldOut ||
                      !currentProduct.productId
                    }
                    className={`flex-1 h-[52px] w-[222px] py-3 rounded-full font-medium ${
                      selectedSize &&
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
                    !selectedSize ||
                    isProcessing ||
                    isSelectedSizeSoldOut ||
                    quantity <= 1
                  }
                  className={`px-3 py-2 ${
                    selectedSize &&
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
                    !selectedSize ||
                    isProcessing ||
                    isSelectedSizeSoldOut ||
                    quantity >= MAX_QUANTITY
                  }
                  className={`px-3 py-2 ${
                    selectedSize &&
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
                  !selectedSize ||
                  isProcessing ||
                  isSelectedSizeSoldOut ||
                  !currentProduct.productId
                }
                className={`flex-1 py-3 px-6 rounded-full font-medium sm:text-base text-sm ${
                  selectedSize &&
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
