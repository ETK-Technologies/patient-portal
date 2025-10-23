"use client";

import { useState, useEffect, useRef } from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";

export default function ScrollArrows({
  containerRef,
  className = "",
  scrollAmount = 200,
  showOnMobile = false,
}) {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const checkScrollPosition = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;

      // Show left arrow if scrolled from the start
      setShowLeftArrow(scrollLeft > 0);

      // Show right arrow if there's more content to scroll
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    };

    // Initial check
    checkScrollPosition();

    // Add scroll listener
    container.addEventListener("scroll", checkScrollPosition);

    // Add resize listener to handle container size changes
    window.addEventListener("resize", checkScrollPosition);

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [containerRef]);

  const scrollLeft = () => {
    if (containerRef?.current) {
      containerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (containerRef?.current) {
      containerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={`${className}`}>
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={scrollLeft}
          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-[44px] h-[44px] bg-white rounded-full shadow-[0px_0px_4px_0px_#00000014] flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer ${
            showOnMobile ? "" : "hidden md:flex"
          }`}
          aria-label="Scroll left"
        >
          <FaArrowLeft className="text-[14px]" />
        </button>
      )}

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={scrollRight}
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-[44px] h-[44px] bg-white rounded-full shadow-[0px_0px_4px_0px_#00000014] flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer ${
            showOnMobile ? "" : "hidden md:flex"
          }`}
          aria-label="Scroll right"
        >
          <FaArrowRight className="text-[14px]" />
        </button>
      )}
    </div>
  );
}
