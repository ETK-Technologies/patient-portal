"use client";

import { useRef } from "react";
import TreatmentCard from "./TreatmentCard";
import ScrollIndicator from "./ScrollIndicator";

export default function TreatmentsGrid({ treatments, showAll = false }) {
  const displayTreatments = showAll ? treatments : treatments.slice(0, 3);
  const scrollContainerRef = useRef(null);

  if (showAll) {
    // Grid layout for treatments page
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
        {displayTreatments.map((treatment, index) => (
          <TreatmentCard
            key={index}
            title={treatment.title}
            description={treatment.description}
            imageUrl={treatment.imageUrl}
            link={treatment.link}
          />
        ))}
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
