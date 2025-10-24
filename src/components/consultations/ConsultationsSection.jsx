"use client";

import { useRef } from "react";
import ConsultationCard from "./ConsultationCard";
import { consultationsData } from "./consultationsData";
import ScrollIndicator from "../utils/ScrollIndicator";
import ScrollArrows from "../utils/ScrollArrows";
import CustomButton from "../utils/CustomButton";

export default function ConsultationsSection() {
  const completedScrollRef = useRef(null);

  // Filter consultations by status
  const completedConsultations = consultationsData.filter(
    (consultation) => consultation.status === "completed"
  );
  const pendingConsultations = consultationsData.filter(
    (consultation) => consultation.status === "pending"
  );

  return (
    <div>
      {/* Completed Section */}
      {completedConsultations.length > 0 && (
        <div className="mb-8 md:mb-12">
          <h2 className="text-[18px] md:text-[20px] font-[500] leading-[140%] mb-4">
            Completed
          </h2>

          {/* Horizontal scroll on both mobile and desktop */}
          <div className="relative">
            <div
              ref={completedScrollRef}
              className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2"
            >
              {completedConsultations.map((consultation) => (
                <div key={consultation.id}>
                  <ConsultationCard consultation={consultation} />
                </div>
              ))}
            </div>

            {/* Scroll Arrows for Desktop */}
            <ScrollArrows
              containerRef={completedScrollRef}
              scrollAmount={350}
              showOnMobile={false}
            />
          </div>

          {/* Scroll Indicator for Mobile Only */}
          <div className="md:hidden">
            <ScrollIndicator
              containerRef={completedScrollRef}
              totalItems={completedConsultations.length}
            />
          </div>
        </div>
      )}

      {/* Pending Section */}
      {pendingConsultations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[18px] md:text-[20px] font-[500] leading-[140%] mb-4">
            Pending
          </h2>

          {/* Both Mobile and Desktop: Vertical stack, full width */}
          <div className="flex flex-col gap-4">
            {pendingConsultations.map((consultation) => (
              <ConsultationCard
                key={consultation.id}
                consultation={consultation}
              />
            ))}
          </div>
        </div>
      )}

      {/* View All Button */}
      <div className="mt-6">
        <CustomButton
          text="View All"
          size="medium"
          width="full"
          variant="pill"
          justify="center"
          className="bg-[#F1F0EF] border border-[#E2E2E1] text-[#000000] hover:bg-[#E8E7E6]"
        />
      </div>
    </div>
  );
}
