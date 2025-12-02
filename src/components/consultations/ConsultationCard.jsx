"use client";

import CustomImage from "../utils/CustomImage";
import StatusBadge from "../utils/StatusBadge";
import CustomButton from "../utils/CustomButton";
import { FaArrowRight } from "react-icons/fa";

export default function ConsultationCard({ consultation }) {
  const {
    status,
    category,
    title,
    description,
    completedDate,
    startedDate,
    progress,
    incompleteQuestionnaireLink,
  } = consultation;

  const isCompleted = status === "completed";

  if (isCompleted) {
    // Completed Consultation Card
    return (
      <div className="bg-white w-[272px] md:w-[324px] shadow-[0px_0px_16px_0px_#00000014] rounded-[16px] p-5 md:p-6">
        {/* Category */}
        <h3 className="text-[#AE7E56] text-[16px] font-[500] leading-[140%] mb-1">
          {category}
        </h3>

        {/* Title */}
        <p className="text-[14px] md:text-[16px] font-[500] leading-[140%] mb-3">
          {title}
        </p>

        {/* Completed Date */}
        <p className="text-[12px] font-[500] leading-[140%] text-[#00000099] mb-3">
          Completed: {completedDate}
        </p>

        {/* Description */}
        <p className="text-[12px] font-[400] leading-[140%] text-[#212121] mb-4">
          {description}
        </p>

        <div className="border-t border-[#E2E2E1] my-4"></div>

        {/* Status Badge */}
        <div>
          <StatusBadge status="completed" />
        </div>

        {/* See Details Button */}
        {/* <CustomButton
          text="See Details"
          icon={<FaArrowRight />}
          size="small"
          width="full"
          variant="pill"
          justify="center"
          className="bg-[#000] text-white hover:bg-[#333] h-[40px] text-[14px]"
        /> */}
      </div>
    );
  }

  // Pending Consultation Card
  return (
    <div className="bg-white w-full shadow-[0px_0px_16px_0px_#00000014] rounded-[16px] p-5 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {/* Title */}
        <h3 className="text-[16px] font-[500] leading-[140%] mb-3">
          Complete your <span className="text-[#AE7E56]">{category}</span>{" "}
          questionnaire
        </h3>

        {/* Started Date */}
        <p className="text-[12px] font-[500] leading-[140%] text-[#00000099] mb-3">
          Started: {startedDate}
        </p>
      </div>

      {/* Description */}
      <p className="text-[12px] font-[400] leading-[140%] text-[#212121] mb-4">
        {description}
      </p>

      {/* Progress Bar and Button - Mobile: Stack, Desktop: Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Progress Bar */}
        <div className="flex-1 max-w-[320px]">
          <p className="text-[12px] font-[400] leading-[140%] text-[#AE7E56] mb-2">
            {progress}% complete
          </p>
          <div className="w-full h-[4px] bg-[#F5F5F5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#AE7E56] transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Complete Now Button */}
        <div className="md:w-auto w-full md:w-[171px]">
          {incompleteQuestionnaireLink ? (
            <a
              href={incompleteQuestionnaireLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <CustomButton
                text="Complete Now"
                icon={<FaArrowRight />}
                size="small"
                width="full"
                variant="pill"
                justify="center"
                className="bg-[#000] text-white hover:bg-[#333] h-[40px] text-[14px]"
              />
            </a>
          ) : (
            <CustomButton
              text="Complete Now"
              icon={<FaArrowRight />}
              size="small"
              width="full"
              variant="pill"
              justify="center"
              className="bg-[#000] text-white hover:bg-[#333] h-[40px] text-[14px]"
            />
          )}
        </div>
      </div>
    </div>
  );
}
