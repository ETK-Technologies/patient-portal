"use client";

import { FiDownload } from "react-icons/fi";

const PrescriptionsTable = ({ prescriptions }) => {
  const handleDownload = (prescription) => {
    // TODO: Implement download functionality
    console.log("Download prescription:", prescription.id);
  };

  return (
    <div className="bg-white main-shadow rounded-[16px] overflow-hidden">
      <div className="overflow-x-auto p-5">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-[10px] font-normal text-sm leading-[140%] tracking-[0px] text-[#00000099] w-[139px]">
                Prescription ID
              </th>
              <th className="text-left py-[10px] font-normal text-sm leading-[140%] tracking-[0px] text-[#00000099] w-[234px]">
                Medication
              </th>
              <th className="text-left py-[10px] font-normal text-sm leading-[140%] tracking-[0px] text-[#00000099] w-[160px]">
                Prescriber
              </th>
              <th className="text-left py-[10px] font-normal text-sm leading-[140%] tracking-[0px] text-[#00000099] w-[143px]">
                Prescribed Date
              </th>
              <th className="text-left py-[10px] font-normal text-sm leading-[140%] tracking-[0px] text-[#00000099] w-[84px]">
                Prescription
              </th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((prescription, index) => (
              <tr
                key={prescription.id}
                className={`border-b border-[#E2E2E1] ${
                  index === prescriptions.length - 1 ? "border-b-0" : ""
                }`}
              >
                <td className="py-[26px] font-normal text-sm leading-[140%] tracking-[0px] w-[139px]">
                  {prescription.prescriptionId}
                </td>
                <td className="py-[26px] w-[234px]">
                  <div className="flex flex-col gap-1">
                    {prescription.medications.map((med, medIndex) => (
                      <div key={medIndex} className="flex items-center gap-2">
                        <span className="font-normal text-sm leading-[140%] tracking-[0px]">
                          {med.name}
                        </span>
                        <span className="px-1 py-[1.5px] rounded-[4px] text-black bg-[#F3F3F3] font-normal text-xs leading-[140%] tracking-[-2%] align-middle">
                          {med.dosage}
                        </span>
                      </div>
                    ))}
                    {prescription.hasMore && (
                      <span className="font-normal text-sm leading-[140%] tracking-[0px]">
                        +{prescription.moreCount} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-[26px] font-normal text-sm leading-[140%] tracking-[0px] w-[160px]">
                  {prescription.prescriber}
                </td>
                <td className="py-[26px] font-normal text-sm leading-[140%] tracking-[0px] w-[143px]">
                  {prescription.prescribedDate}
                </td>
                <td className="py-4 px-5 w-[84px]">
                  <button
                    onClick={() => handleDownload(prescription)}
                    className="p-2 hover:bg-[#F9F9F9] rounded-[8px] transition-colors cursor-pointer"
                    aria-label="Download prescription"
                  >
                    <FiDownload className="w-5 h-5 text-[#212121]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrescriptionsTable;
