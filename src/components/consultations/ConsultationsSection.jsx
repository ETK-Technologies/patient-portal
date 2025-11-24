"use client";

import { useRef, useEffect, useState } from "react";
import ConsultationCard from "./ConsultationCard";
import ScrollIndicator from "../utils/ScrollIndicator";
import ScrollArrows from "../utils/ScrollArrows";
import CustomButton from "../utils/CustomButton";
import ConsultationCardSkeleton, { ConsultationCardCompletedSkeleton } from "../utils/skeletons/ConsultationCardSkeleton";

// Helper function to get value - if field exists (even if empty), return empty string, otherwise return "Data not exist in API response"
const getFieldValue = (obj, fieldName) => {
  if (obj && typeof obj === "object" && fieldName in obj) {
    const value = obj[fieldName];
    // Field exists - return empty string if null/undefined/empty, otherwise return the value
    if (value === null || value === undefined || value === "") {
      return "";
    }
    return value;
  }
  // Field doesn't exist
  return "Data not exist in API response";
};

// Helper to format date from API format to display format
const formatDate = (dateString) => {
  if (!dateString || dateString === "Data not exist in API response") {
    return dateString;
  }
  try {
    // Handle formats like "2025-10-14 11:23 am" or ISO format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if can't parse
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

// Map API consultation data to component structure
// New API format: { wp_entry_id, form_id, questionnaire_type, created_at, completion_state, completion_percentage, incomplete_questionnaire_link }
const mapConsultation = (apiConsultation) => {
  const missingData = "Data not exist in API response";

  // Get fields directly from new API format
  const wpEntryId = apiConsultation.wp_entry_id || apiConsultation.id;
  const questionnaireType = apiConsultation.questionnaire_type || missingData;
  const completionState = apiConsultation.completion_state || "";
  const completionPercentage = apiConsultation.completion_percentage || "0";
  const createdAt = apiConsultation.created_at || missingData;
  const incompleteLink = apiConsultation.incomplete_questionnaire_link || null;

  // Determine status based on completion_state
  // "Full" or "FULL" = completed, "Partial" = pending
  const status =
    completionState === "Full" || completionState === "FULL"
      ? "completed"
      : completionState === "Partial"
      ? "pending"
      : missingData;

  // Get progress percentage (parse string to number)
  const progress = parseInt(completionPercentage) || 0;
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  // Format created date (already formatted like "Oct 10" from API, but handle if needed)
  const formattedCreatedDate = createdAt !== missingData ? createdAt : missingData;

  // Determine completed date and started date
  const completedDate = status === "completed" ? formattedCreatedDate : missingData;
  const startedDate = formattedCreatedDate;

  // Generate title and description
  const title =
    status === "completed"
      ? "questionnaire completed"
      : `Complete your ${
          questionnaireType !== missingData ? questionnaireType : "questionnaire"
        } questionnaire`;

  const description =
    status === "completed"
      ? `${
          questionnaireType !== missingData ? questionnaireType : "Questionnaire"
        } questionnaire submitted successfully. We'll review your answers and follow up if needed.`
      : "Finish the remaining questions and see if you're eligible today.";

  return {
    id: wpEntryId || missingData,
    category: questionnaireType,
    status: status,
    completedDate: completedDate,
    startedDate: startedDate,
    progress: normalizedProgress,
    title: title,
    description: description,
    imageUrl: "/globe.svg",
    incompleteQuestionnaireLink: incompleteLink, // Store link for "Continue" action
    // Store original API data for reference
    originalData: apiConsultation,
  };
};

export default function ConsultationsSection() {
  const completedScrollRef = useRef(null);
  const [mappedConsultations, setMappedConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllPending, setShowAllPending] = useState(false);

  // Fetch consultations when component mounts
  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        console.log("[CONSULTATIONS_SECTION] Fetching consultations...");
        setLoading(true);
        setError(null);

        const response = await fetch("/api/user/consultations");

        if (!response.ok) {
          const errorData = await response.json();
          console.error(
            "[CONSULTATIONS_SECTION] Error fetching consultations:",
            errorData
          );
          setError(errorData.error || errorData.message || "Failed to fetch consultations");
          setMappedConsultations([]);
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        // Handle both response formats: { status: true, ... } or { success: true, ... }
        if (!data.status && !data.success) {
          console.error(
            "[CONSULTATIONS_SECTION] Invalid response format:",
            data
          );
          setError("Invalid response format from API");
          setMappedConsultations([]);
          setLoading(false);
          return;
        }
        console.log(
          "[CONSULTATIONS_SECTION] Consultations API response:",
          data
        );
        console.log(
          "[CONSULTATIONS_SECTION] Full consultations data:",
          JSON.stringify(data, null, 2)
        );

        // Map the consultations data - new format: { status: true, message: "...", data: [...], pagination: {...} }
        // data is already an array of consultations
        const consultations = Array.isArray(data.data) ? data.data : [];
        console.log(
          `[CONSULTATIONS_SECTION] Found ${consultations.length} consultations in response.data`
        );

        const mapped = consultations.map((consultation, index) => {
          const mappedConsultation = mapConsultation(consultation);
          // Ensure ID is always valid - use wp_entry_id from API
          if (
            !mappedConsultation.id ||
            mappedConsultation.id === "Data not exist in API response"
          ) {
            mappedConsultation.id =
              consultation.wp_entry_id || `consultation-${index}`;
          }
          return mappedConsultation;
        });
        setMappedConsultations(mapped);
        console.log(
          "[CONSULTATIONS_SECTION] Mapped consultations:",
          JSON.stringify(mapped, null, 2)
        );
        setLoading(false);
      } catch (error) {
        console.error(
          "[CONSULTATIONS_SECTION] Error fetching consultations:",
          error
        );
        setError(error.message || "Failed to fetch consultations");
        setMappedConsultations([]);
        setLoading(false);
      }
    };

    fetchConsultations();
  }, []);

  // Use only mapped consultations from API - no fallback data
  const consultationsToDisplay = mappedConsultations;

  // Filter consultations by status
  const completedConsultations = consultationsToDisplay.filter(
    (consultation) => consultation.status === "completed"
  );
  const pendingConsultations = consultationsToDisplay.filter(
    (consultation) => consultation.status === "pending"
  );

  if (loading) {
    return (
      <div>
        {/* Completed Section Skeleton */}
        <div className="mb-8 md:mb-12">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
          <div className="relative">
            <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2">
              <ConsultationCardCompletedSkeleton />
              <ConsultationCardCompletedSkeleton />
              <ConsultationCardCompletedSkeleton />
            </div>
          </div>
        </div>
        {/* Pending Section Skeleton */}
        <div className="mb-8">
          <div className="h-6 bg-gray-200 rounded w-20 mb-4 animate-pulse"></div>
          <div className="flex flex-col gap-4">
            <ConsultationCardSkeleton />
            <ConsultationCardSkeleton />
            <ConsultationCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600 text-center">Error: {error}</p>
      </div>
    );
  }

  // Show empty state if no consultations
  if (consultationsToDisplay.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600 text-center">No consultations available</p>
      </div>
    );
  }

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
              {completedConsultations.map((consultation, index) => (
                <div key={`completed-${consultation.id}-${index}`}>
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
            {(showAllPending
              ? pendingConsultations
              : pendingConsultations.slice(0, 3)
            ).map((consultation, index) => (
              <ConsultationCard
                key={`pending-${consultation.id}-${index}`}
                consultation={consultation}
              />
            ))}
          </div>

          {/* View All Button - Only show if there are more than 3 pending consultations */}
          {pendingConsultations.length > 3 && !showAllPending && (
            <div className="mt-6">
              <CustomButton
                text="View All"
                size="medium"
                width="full"
                variant="pill"
                justify="center"
                className="bg-[#F1F0EF] border border-[#E2E2E1] text-[#000000] hover:bg-[#E8E7E6]"
                onClick={() => setShowAllPending(true)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
