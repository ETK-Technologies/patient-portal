"use client";

import { useEffect, useState } from "react";
import ConsultationCard from "../consultations/ConsultationCard";
import CustomButton from "../utils/CustomButton";
import { FaArrowRight } from "react-icons/fa";

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

export default function IncompleteConsultationsSection() {
  const [mappedConsultations, setMappedConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch consultations when component mounts
  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/user/consultations");

        if (!response.ok) {
          console.error(
            "[INCOMPLETE_CONSULTATIONS] Error fetching consultations"
          );
          setMappedConsultations([]);
          setLoading(false);
          return;
        }

        const data = await response.json();

        // Map the consultations data - handle multiple possible response structures
        // Response can be: { consultations: [...] } or { data: { consultations: [...] } } or { consultations: [...], data: { consultations: [...] } }
        const consultationsRaw =
          data.consultations ||
          (data.data && Array.isArray(data.data) ? data.data : null) ||
          (data.data && data.data.consultations
            ? data.data.consultations
            : null);
        const consultations = Array.isArray(consultationsRaw)
          ? consultationsRaw
          : [];
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

        // Filter for incomplete (pending) consultations only
        const incompleteConsultations = mapped.filter(
          (consultation) => consultation.status === "pending"
        );

        setMappedConsultations(incompleteConsultations);
        setLoading(false);
      } catch (error) {
        console.error(
          "[INCOMPLETE_CONSULTATIONS] Error fetching consultations:",
          error
        );
        setMappedConsultations([]);
        setLoading(false);
      }
    };

    fetchConsultations();
  }, []);

  // Don't render if loading or no incomplete consultations
  if (loading || mappedConsultations.length === 0) {
    return null;
  }

  // Show only first 2 incomplete consultations
  const consultationsToShow = mappedConsultations.slice(0, 2);
  const hasMore = mappedConsultations.length > 2;

  return (
    <div>
      <h2 className="text-[24px] md:text-[20px] leading-[140%] font-[500] mb-4">
        Consultations
      </h2>

      {/* Show consultations */}
      <div className="flex flex-col gap-4 mb-6">
        {consultationsToShow.map((consultation, index) => (
          <ConsultationCard
            key={`incomplete-${consultation.id}-${index}`}
            consultation={consultation}
          />
        ))}
      </div>

      {/* View More Button - Only show if there are more than 2 */}
      {hasMore && (
        <div className="mt-6 md:mt-4">
          <CustomButton
            href="/consultations"
            text="View More"
            icon={<FaArrowRight />}
            size="medium"
            width="full"
            className="bg-[#F1F0EF] border border-[#E2E2E1] text-[#000000] hover:bg-[#E8E7E6]"
          />
        </div>
      )}
    </div>
  );
}
