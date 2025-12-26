"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { IoClose, IoChevronUp, IoChevronDown } from "react-icons/io5";
import CustomImage from "@/components/utils/CustomImage";
import { formatPrice } from "@/utils/priceFormatter";

const SimpleProductModal = ({ isOpen, onClose, product }) => {
  const currentProduct = product;
  const isCap = currentProduct?.productId === "353755";
  const [quantity, setQuantity] = useState(1);
  const MAX_QUANTITY = 10;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [openSections, setOpenSections] = useState({
    description: true,
    sizeAndFit: true,
    care: true,
    benefits: false,
    ingredients: false,
    features: false,
    dosage: false,
    faqs: false,
  });
  const previousProductIdRef = useRef(null);

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

  // Extract colors and sizes from attributes (for Cap)
  const colors = useMemo(() => {
    if (!isCap || !currentProduct?._wcData?.attributes) return [];
    const colorAttr = currentProduct._wcData.attributes.find(
      (attr) => attr.name === "Color" || attr.slug === "pa_color"
    );
    if (!colorAttr?.options) return [];
    return colorAttr.options.map((color) => ({
      name: color.toLowerCase(),
      value: color.toLowerCase() === "black" ? "#000000" : "#CCCCCC",
    }));
  }, [isCap, currentProduct?._wcData?.attributes]);

  const sizes = useMemo(() => {
    if (!isCap || !currentProduct?._wcData?.attributes) return [];
    const sizeAttr = currentProduct._wcData.attributes.find(
      (attr) => attr.name === "Size" || attr.slug === "pa_size"
    );
    return sizeAttr?.options || [];
  }, [isCap, currentProduct?._wcData?.attributes]);

  // Initialize selected color and size for Cap
  useEffect(() => {
    if (isCap && colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0].name);
    }
    if (isCap && sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCap, colors.length, sizes.length]);

  // Helper function to clean HTML
  const cleanHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  };

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
          setOpenSections({
            description: true,
            sizeAndFit: true,
            care: true,
            benefits: false,
            ingredients: false,
            features: false,
            dosage: false,
            faqs: false,
          });
          if (isCap && colors.length > 0) {
            setSelectedColor(colors[0].name);
          }
          if (isCap && sizes.length > 0) {
            setSelectedSize(sizes[0]);
          }
        }, 0);
        previousProductIdRef.current = currentProduct?.id;
      }
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentProduct]);

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

  const handleBuyNow = async () => {
    if (!currentProduct.productId) {
      return;
    }

    setIsProcessing(true);

    try {
      const productId = currentProduct.productId;

      // Reset state before closing
      setQuantity(1);
      setSelectedImageIndex(0);
      if (isCap && colors.length > 0) {
        setSelectedColor(colors[0].name);
      }
      if (isCap && sizes.length > 0) {
        setSelectedSize(sizes[0]);
      }

      // Close modal
      onClose();

      const baseUrl =
        process.env.NEXT_PUBLIC_ROCKY_API_URL;
      const checkoutUrl = `${baseUrl}/checkout?onboarding-add-to-cart=${productId}`;

      console.log("[SimpleProductModal] Redirecting to checkout:", checkoutUrl);

      // Open checkout in new tab
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
          <div className="flex flex-col lg:flex-row-reverse h-full flex-1 min-h-0">
            {/* Product Images - Top on mobile, Right on desktop */}
            <div className="lg:w-96">
              <div className="relative h-full">
                {/* Main Product Image */}
                <div
                  className={`relative w-full h-[300px] rounded-t-2xl mb-2 bg-[#F3F3F3] lg:mb-0 flex items-center justify-center lg:p-0 ${
                    currentProduct?.productId === "353755"
                      ? "lg:h-[462px]"
                      : "lg:h-full"
                  }`}
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
            <div className="flex-1 px-5 py-4 lg:p-8 overflow-y-auto relative flex flex-col">
              {/* Product Name */}
              <h2 className="text-[20px] md:text-[24px] font-medium text-black mb-2 tracking-[0%] leading-[140%]">
                {currentProduct.name}
              </h2>

              {/* Product Description */}
              <p className="text-black text-sm lg:text-base tracking-[-1%] leading-[140%] mb-2">
                {cleanHtml(
                  currentProduct?.short_description ||
                    currentProduct?.description ||
                    ""
                )}
              </p>

              {/* Price */}
              {priceValue > 0 && (
                <p className="text-lg font-medium text-black mb-4">
                  ${formatPrice(priceValue)}
                </p>
              )}

              {/* Color Selection - For Cap */}
              {isCap && colors.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-base md:text-lg font-medium text-black tracking-[0%] leading-[140%]">
                      Color:{" "}
                      {selectedColor
                        ? selectedColor.charAt(0).toUpperCase() +
                          selectedColor.slice(1)
                        : ""}
                    </span>
                    <div
                      className="w-12 h-12 rounded-full border-2 border-white shadow-[0_0_0_1px_black] cursor-pointer"
                      style={{
                        backgroundColor:
                          colors.find((c) => c.name === selectedColor)?.value ||
                          "#000000",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Size Selection - For Cap */}
              {isCap && sizes.length > 0 && (
                <div className="mb-4 lg:mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base md:text-lg font-medium text-black tracking-[0%] leading-[140%]">
                      Select Size:
                    </span>
                    <button
                      onClick={() => {
                        const sizeAndFitSection = document.querySelector(
                          '[data-section="sizeAndFit"]'
                        );
                        if (sizeAndFitSection) {
                          sizeAndFitSection.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                      }}
                      className="text-sm md:text-base text-black underline tracking-[0%] leading-[140%] hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      Size Guide
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={isProcessing}
                        className={`relative px-3 lg:px-4 py-2 h-12 border rounded-lg text-base font-medium transition-colors ${
                          size === "One Size" || size === "One Size Fits All"
                            ? "min-w-fit"
                            : "w-12"
                        } ${
                          selectedSize === size
                            ? "border-gray-900 bg-white text-black cursor-pointer"
                            : "border-gray-300 bg-white text-black hover:border-gray-400 cursor-pointer"
                        } ${
                          isProcessing ? "cursor-not-allowed opacity-50" : ""
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Accordion Sections */}
              <div className="space-y-4 flex-1">
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
                        {cleanHtml(
                          currentProduct?.detailedDescription ||
                            currentProduct?.details?.description ||
                            currentProduct?.description ||
                            currentProduct?._wcData?.description ||
                            ""
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Size and Fit - For Cap */}
                {isCap && (
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
                      <div className="pb-3 text-sm text-[#000000CC] space-y-2">
                        <p>Fit: true to size</p>
                        {sizes.length > 0 && <p>{sizes[0]}</p>}
                        <p>Adjustable fit</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Care - For Cap */}
                {isCap && (
                  <div className="border-b border-gray-200">
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
                      <div className="pb-3 text-sm text-[#000000CC]">
                        <p>
                          We recommend machine washing in cold water and air
                          drying to maintain integrity. For hats, hand wash
                          gently and air dry.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Key Benefits - For Wellness Products */}
                {!isCap &&
                  (currentProduct?.keyBenefits ||
                    currentProduct?.details?.benefits) && (
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => toggleSection("benefits")}
                        className="flex items-center justify-between w-full py-3 text-left cursor-pointer"
                      >
                        <span className="font-medium text-gray-900">
                          Key Benefits
                        </span>
                        {openSections.benefits ? (
                          <IoChevronUp className="w-5 h-5" />
                        ) : (
                          <IoChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      {openSections.benefits && (
                        <div className="pb-3 text-sm text-[#000000CC]">
                          {(() => {
                            const benefits =
                              currentProduct?.keyBenefits ||
                              currentProduct?.details?.benefits;
                            return Array.isArray(benefits) ? (
                              <ul className="list-disc list-inside space-y-2">
                                {benefits.map((benefit, index) => (
                                  <li key={index}>{benefit}</li>
                                ))}
                              </ul>
                            ) : (
                              <p>{benefits}</p>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                {/* Key Ingredients - For Wellness Products */}
                {!isCap &&
                  (currentProduct?.keyIngredients ||
                    currentProduct?.details?.ingredients) && (
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => toggleSection("ingredients")}
                        className="flex items-center justify-between w-full py-3 text-left cursor-pointer"
                      >
                        <span className="font-medium text-gray-900">
                          Key Ingredients
                        </span>
                        {openSections.ingredients ? (
                          <IoChevronUp className="w-5 h-5" />
                        ) : (
                          <IoChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      {openSections.ingredients && (
                        <div className="pb-3 text-sm text-[#000000CC]">
                          {(() => {
                            const ingredients =
                              currentProduct?.keyIngredients ||
                              currentProduct?.details?.ingredients;
                            return Array.isArray(ingredients) ? (
                              <ul className="list-disc list-inside space-y-2">
                                {ingredients.map((ingredient, index) => (
                                  <li key={index}>{ingredient}</li>
                                ))}
                              </ul>
                            ) : (
                              <p>{ingredients}</p>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                {/* Features - For Wellness Products */}
                {!isCap &&
                  (currentProduct?.features ||
                    currentProduct?.details?.features) && (
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => toggleSection("features")}
                        className="flex items-center justify-between w-full py-3 text-left cursor-pointer"
                      >
                        <span className="font-medium text-gray-900">
                          Features
                        </span>
                        {openSections.features ? (
                          <IoChevronUp className="w-5 h-5" />
                        ) : (
                          <IoChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      {openSections.features && (
                        <div className="pb-3 text-sm text-[#000000CC]">
                          {(() => {
                            const features =
                              currentProduct?.features ||
                              currentProduct?.details?.features;
                            return Array.isArray(features) ? (
                              <ul className="list-disc list-inside space-y-2">
                                {features.map((feature, index) => (
                                  <li key={index}>{feature}</li>
                                ))}
                              </ul>
                            ) : (
                              <p>{features}</p>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                {/* Dosage - For Wellness Products */}
                {!isCap &&
                  (currentProduct?.dosage ||
                    currentProduct?.details?.dosage) && (
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => toggleSection("dosage")}
                        className="flex items-center justify-between w-full py-3 text-left cursor-pointer"
                      >
                        <span className="font-medium text-gray-900">
                          Dosage
                        </span>
                        {openSections.dosage ? (
                          <IoChevronUp className="w-5 h-5" />
                        ) : (
                          <IoChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      {openSections.dosage && (
                        <div className="pb-3 text-sm text-[#000000CC]">
                          <p>
                            {currentProduct?.dosage ||
                              currentProduct?.details?.dosage}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                {/* FAQs - For Wellness Products */}
                {!isCap &&
                  (currentProduct?.faqs || currentProduct?.details?.faqs) && (
                    <div className="">
                      <button
                        onClick={() => toggleSection("faqs")}
                        className="flex items-center justify-between w-full py-3 text-left cursor-pointer"
                      >
                        <span className="font-medium text-gray-900">FAQs</span>
                        {openSections.faqs ? (
                          <IoChevronUp className="w-5 h-5" />
                        ) : (
                          <IoChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      {openSections.faqs && (
                        <div className="pb-3 text-sm text-[#000000CC] space-y-4">
                          {(() => {
                            const faqs =
                              currentProduct?.faqs ||
                              currentProduct?.details?.faqs;
                            return Array.isArray(faqs) ? (
                              faqs.map((faq, index) => (
                                <div key={index} className="space-y-1">
                                  <p className="font-medium text-black">
                                    {faq.question || faq.q}
                                  </p>
                                  <p>{faq.answer || faq.a}</p>
                                </div>
                              ))
                            ) : (
                              <p>{faqs}</p>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Spacer for fixed button on mobile */}
              <div className="h-20 lg:hidden"></div>

              {/* Desktop Buy Now Button - Sticky at bottom */}
              <div
                className="hidden lg:block sticky bottom-0 bg-white -mx-8 mt-auto"
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
                      disabled={isProcessing || quantity <= 1}
                      className={`flex items-center justify-center w-4 h-4 text-lg text-center ${
                        !isProcessing && quantity > 1
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
                      disabled={isProcessing || quantity >= MAX_QUANTITY}
                      className={`flex items-center justify-center w-4 h-4 text-lg text-center ${
                        !isProcessing && quantity < MAX_QUANTITY
                          ? "text-gray-600 hover:text-gray-800 cursor-pointer"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleBuyNow}
                    disabled={isProcessing || !currentProduct.productId}
                    className={`flex-1 h-[52px] w-[222px] py-3 rounded-full font-medium ${
                      !isProcessing && currentProduct.productId
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
                  disabled={isProcessing || quantity <= 1}
                  className={`px-3 py-2 ${
                    !isProcessing && quantity > 1
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
                  disabled={isProcessing || quantity >= MAX_QUANTITY}
                  className={`px-3 py-2 ${
                    !isProcessing && quantity < MAX_QUANTITY
                      ? "text-gray-600 hover:text-gray-800 cursor-pointer"
                      : "text-gray-300 cursor-not-allowed"
                  }`}
                >
                  +
                </button>
              </div>
              <button
                onClick={handleBuyNow}
                disabled={isProcessing || !currentProduct.productId}
                className={`flex-1 py-3 px-6 rounded-full font-medium sm:text-base text-sm ${
                  !isProcessing && currentProduct.productId
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

export default SimpleProductModal;
