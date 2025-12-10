"use client";

import { useRef } from "react";
import TreatmentCard from "./TreatmentCard";
import ScrollIndicator from "../utils/ScrollIndicator";

export default function TreatmentsGrid({ treatments, showAll = false }) {
  const displayTreatments = showAll ? treatments : treatments.slice(0, 3);
  const scrollContainerRef = useRef(null);

  if (showAll) {
    // Split treatments: first 3 and remaining
    const firstThree = treatments.slice(0, 3);
    const remaining = treatments.slice(3);
    const remainingScrollRef = useRef(null);

    return (
      <div>
        {/* First 3 cards: Full width on mobile, grid on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 mb-2 md:mb-4">
          {firstThree.map((treatment, index) => (
            <TreatmentCard
              key={index}
              title={treatment.title}
              description={treatment.description}
              imageUrl={treatment.imageUrl}
              mobileImageUrl={treatment.mobileImageUrl}
              link={treatment.link}
            />
          ))}
        </div>

        {/* Remaining cards: Horizontal scroll on mobile, grid on desktop */}
        {remaining.length > 0 && (
          <>
            {/* Mobile: Horizontal scroll */}
            <div
              ref={remainingScrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide md:hidden"
            >
              {remaining.map((treatment, index) => (
                <TreatmentCard
                  key={index + 3}
                  title={treatment.title}
                  description={treatment.description}
                  imageUrl={treatment.imageUrl}
                  mobileImageUrl={treatment.mobileImageUrl}
                  link={treatment.link}
                  isScrollable={true}
                />
              ))}
            </div>
            {/* Desktop: Grid layout */}
            <div className="hidden md:grid md:grid-cols-3 md:gap-4">
              {remaining.map((treatment, index) => (
                <TreatmentCard
                  key={index + 3}
                  title={treatment.title}
                  description={treatment.description}
                  imageUrl={treatment.imageUrl}
                  mobileImageUrl={treatment.mobileImageUrl}
                  link={treatment.link}
                />
              ))}
            </div>
            {/* Scroll Indicator for mobile only */}
            <div className="md:hidden">
              <ScrollIndicator
                containerRef={remainingScrollRef}
                totalItems={remaining.length}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  // Horizontal scroll layout for home page
  return (
    <>
      <div
        ref={scrollContainerRef}
        className="flex gap-2 md:gap-4 overflow-x-auto scrollbar-hide"
      >
        {displayTreatments.map((treatment, index) => (
          <TreatmentCard
            key={index}
            title={treatment.title}
            description={treatment.description}
            imageUrl={treatment.imageUrl}
            mobileImageUrl={treatment.mobileImageUrl}
            link={treatment.link}
            isScrollable={true}
          />
        ))}
      </div>
      <ScrollIndicator
        containerRef={scrollContainerRef}
        totalItems={displayTreatments.length}
      />
    </>
  );
}
