"use client";

import { useEffect, useState } from "react";
import ConsultationCard from "../consultations/ConsultationCard";
import CustomButton from "../utils/CustomButton";
import ConsultationCardSkeleton from "../utils/skeletons/ConsultationCardSkeleton";
import { FaArrowRight } from "react-icons/fa";

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
  const formattedCreatedDate =
    createdAt !== missingData ? createdAt : missingData;

  // Determine completed date and started date
  const completedDate =
    status === "completed" ? formattedCreatedDate : missingData;
  const startedDate = formattedCreatedDate;

  // Generate title and description
  const title =
    status === "completed"
      ? "questionnaire completed"
      : `Complete your ${
          questionnaireType !== missingData
            ? questionnaireType
            : "questionnaire"
        } questionnaire`;

  const description =
    status === "completed"
      ? `${
          questionnaireType !== missingData
            ? questionnaireType
            : "Questionnaire"
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

        // Handle both response formats: { status: true, ... } or { success: true, ... }
        if (!data.status && !data.success) {
          console.error(
            "[INCOMPLETE_CONSULTATIONS] Invalid response format:",
            data
          );
          setMappedConsultations([]);
          setLoading(false);
          return;
        }

        // Map the consultations data - new format: { status: true, message: "...", data: [...], pagination: {...} }
        // data is already an array of consultations
        const consultations = Array.isArray(data.data) ? data.data : [];
        console.log(
          `[INCOMPLETE_CONSULTATIONS] Found ${consultations.length} consultations in response.data`
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

  // Show loading skeleton while loading
  if (loading) {
    return (
      <div>
        <h2 className="text-[24px] md:text-[20px] leading-[140%] font-[500] mb-4">
          Consultations
        </h2>
        <div className="flex flex-col gap-4 mb-6">
          <ConsultationCardSkeleton />
          <ConsultationCardSkeleton />
        </div>
      </div>
    );
  }

  // Don't render if no incomplete consultations after loading
  if (mappedConsultations.length === 0) {
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
