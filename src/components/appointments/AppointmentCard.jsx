"use client";

import CustomButton from "../utils/CustomButton";
import CustomImage from "../utils/CustomImage";

export default function AppointmentCard({ appointment }) {
  const handleJoinCall = () => {
    console.log("Joining call for appointment:", appointment.id);
    // Add join call logic here
  };

  const handleReschedule = () => {
    console.log("Rescheduling appointment:", appointment.id);
    // Add reschedule logic here
  };

  return (
    <div className="bg-white h-[205px] md:h-[201px] rounded-[16px] p-4 md:p-6 shadow-[0px_0px_16px_0px_#00000014]   hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row-reverse items-start justify-between gap-4">
        {/* Date and Time */}
        <div className="flex items-center gap-2">
          <p className="text-[14px] text-[#212121] font-[500] leading-[140%]">
            {appointment.date}
          </p>
          <div className="w-[1px] h-[16px] bg-[#E2E2E1]"></div>
          <p className="text-[14px] text-[#212121] font-[500] leading-[140%]">
            {appointment.time}
          </p>
        </div>
        <div className="flex items-start gap-4">
          {/* Doctor Image */}
          <div className="relative w-[56px] h-[56px] rounded-full overflow-hidden flex-shrink-0">
            <CustomImage
              src={appointment.doctorImage}
              alt={appointment.doctorName}
              fill
            />
          </div>

          {/* Appointment Info */}
          <div className="flex flex-col">
            <h3 className="text-[#AE7E56] text-[16px] font-[500] leading-[140%] mb-1">
              {appointment.type}
            </h3>
            <p className="text-[14px] font-[500] leading-[140%] mb-[2px]">
              {appointment.doctorName}
            </p>
            <p className="text-[12px] font-[400] leading-[140%]">
              {appointment.credentials}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-[#E2E2E1] my-4 md:my-6"></div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center md:justify-end gap-2">
        {appointment.status === "upcoming" ? (
          <>
            <CustomButton
              onClick={handleJoinCall}
              className="text-[14px] font-[500] leading-[140%] max-h-[40px] md:w-[109px] text-white bg-[#000] hover:bg-gray-300 cursor-not-allowed"
              disabled
            >
              Join Call
            </CustomButton>
            <CustomButton
              onClick={handleReschedule}
              className="text-[14px] font-[500] leading-[140%] bg-white max-h-[40px] md:w-[130px] border border-[#E2E2E1] hover:bg-[#000] hover:text-white"
            >
              Reschedule
            </CustomButton>
          </>
        ) : (
          <CustomButton
            disabled
            className="text-[14px] font-[500] leading-[140%] max-h-[40px] md:w-[109px] text-white bg-[#000]"
          >
            Join Call
          </CustomButton>
        )}
      </div>
    </div>
  );
}
