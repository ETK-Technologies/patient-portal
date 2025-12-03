"use client";

import CustomButton from "../utils/CustomButton";
import { FiDownload } from "react-icons/fi";

const PrescriptionCard = ({ prescription }) => {
  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log("Download prescription:", prescription.id);
  };

  return (
    <div className="bg-white main-shadow rounded-[16px] overflow-hidden p-5 ">
      {/* Top Section: Prescription ID & Medication */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <p className="font-normal text-sm leading-[140%] tracking-[0px] text-[#00000099] mb-1">
            Prescription ID
          </p>
          <p className="font-normal text-sm leading-[140%] tracking-[0px]">
            {prescription.prescriptionId}
          </p>
        </div>
        <div className="flex-1">
          <p className="font-normal text-sm leading-[140%] tracking-[0px] text-[#00000099] mb-1">
            Medication
          </p>
          <div className="flex flex-col gap-2">
            {prescription.medications.map((med, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="font-normal text-sm leading-[140%] tracking-[0px]">
                  {med.name}
                </span>
                <span className="px-1 py-[1.5px] text-black rounded-[4px] bg-[#F3F3F3] font-normal text-xs leading-[140%] tracking-[-2%] align-middle">
                  {med.dosage}
                </span>
              </div>
            ))}
            {prescription.hasMore && (
              <span className="text-[14px] font-[400] leading-[140%] text-[#212121]">
                +{prescription.moreCount} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#E2E2E1] my-4"></div>

      {/* Middle Section: Prescriber & Prescribed Date */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <p className="font-normal text-sm leading-[140%] tracking-[0px] text-[#00000099] mb-1">
            Prescriber
          </p>
          <p className="font-normal text-sm leading-[140%] tracking-[0px]">
            {prescription.prescriber}
          </p>
        </div>
        <div className="flex-1">
          <p className="font-normal text-sm leading-[140%] tracking-[0px] text-[#00000099] mb-1">
            Prescribed Date
          </p>
          <p className="font-normal text-sm leading-[140%] tracking-[0px]">
            {prescription.prescribedDate}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#E2E2E1] my-4"></div>

      {/* Download Button */}
      <CustomButton
        text="Download Prescription"
        icon={<FiDownload />}
        size="medium"
        width="full"
        variant="rounded"
        className="bg-white border border-[#E2E2E1] rounded-[64px] font-medium text-sm leading-[140%] tracking-[0px] align-middle capitalize hover:bg-[#F9F9F9]"
        onClick={handleDownload}
      />
    </div>
  );
};

export default PrescriptionCard;
