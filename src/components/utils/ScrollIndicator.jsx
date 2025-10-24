"use client";

import { useEffect, useState } from "react";

export default function ScrollIndicator({ containerRef, totalItems = 3 }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const percentage = maxScroll > 0 ? scrollLeft / maxScroll : 0;
      const index = Math.round(percentage * (totalItems - 1));
      setActiveIndex(index);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef, totalItems]);

  return (
    <div className="flex justify-center items-center gap-2 mt-4 lg:hidden">
      <div className="relative w-20 h-2 bg-[#EFEFEA] rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-black rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${100 / totalItems}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
      </div>
    </div>
  );
}
