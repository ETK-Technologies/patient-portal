"use client";

import { useRef, useEffect, useState } from "react";
import ConsultationCard from "./ConsultationCard";
import ScrollIndicator from "../utils/ScrollIndicator";
import ScrollArrows from "../utils/ScrollArrows";
import CustomButton from "../utils/CustomButton";

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
const mapConsultation = (apiConsultation) => {
  const missingData = "Data not exist in API response";

  // Get completion state and percentage from user_questionnaire
  const completionState = apiConsultation.user_questionnaire?.find(
    (q) => q.meta_key === "completion_state"
  );
  const completionPercentage = apiConsultation.user_questionnaire?.find(
    (q) => q.meta_key === "completion.percentage"
  );

  const completionStateValue = completionState
    ? getFieldValue(completionState, "meta_value")
    : missingData;
  const completionPercentageValue = completionPercentage
    ? getFieldValue(completionPercentage, "meta_value")
    : missingData;

  // Determine status based on completion_state
  const status =
    completionStateValue === "Full" || completionStateValue === "100"
      ? "completed"
      : completionStateValue !== missingData && completionStateValue !== ""
      ? "pending"
      : missingData;

  // Get progress percentage
  const progress =
    completionPercentageValue !== missingData &&
    completionPercentageValue !== ""
      ? parseInt(completionPercentageValue) || 0
      : status === "completed"
      ? 100
      : 0;

  // Get category from medical_form
  const category = apiConsultation.medical_form
    ? getFieldValue(apiConsultation.medical_form, "wp_form_name")
    : missingData;

  // Format dates
  const createdDate = getFieldValue(apiConsultation, "created_at");
  const updatedDate = getFieldValue(apiConsultation, "updated_at");

  const formattedCreatedDate = formatDate(createdDate);
  const formattedUpdatedDate = formatDate(updatedDate);

  // Determine completed date and started date
  const completedDate =
    status === "completed" ? formattedUpdatedDate : missingData;
  const startedDate =
    formattedCreatedDate !== missingData ? formattedCreatedDate : missingData;

  // Generate title and description
  const title =
    status === "completed"
      ? "questionnaire completed"
      : `Complete your ${
          category !== missingData ? category : "questionnaire"
        } questionnaire`;

  const description =
    status === "completed"
      ? `${
          category !== missingData ? category : "Questionnaire"
        } questionnaire submitted successfully. We'll review your answers and follow up if needed.`
      : "Finish the remaining questions and see if you're eligible today.";

  return {
    id: getFieldValue(apiConsultation, "id"),
    category: category,
    status: status,
    completedDate: completedDate,
    startedDate: startedDate,
    progress: progress,
    title: title,
    description: description,
    imageUrl: "/globe.svg",
    // Store original API data for reference
    originalData: apiConsultation,
  };
};

export default function ConsultationsSection() {
  const completedScrollRef = useRef(null);
  const [mappedConsultations, setMappedConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          setError(errorData.error || "Failed to fetch consultations");
          setMappedConsultations([]);
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log(
          "[CONSULTATIONS_SECTION] Consultations API response:",
          data
        );
        console.log(
          "[CONSULTATIONS_SECTION] Full consultations data:",
          JSON.stringify(data, null, 2)
        );

        // Map the consultations data
        const consultations = data.consultations || data.data || [];
        const mapped = consultations.map((consultation, index) => {
          const mappedConsultation = mapConsultation(consultation);
          // Ensure ID is always valid
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600 text-center">Loading consultations...</p>
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
            {pendingConsultations.map((consultation, index) => (
              <ConsultationCard
                key={`pending-${consultation.id}-${index}`}
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
