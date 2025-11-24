// Loading skeleton component for AppointmentCard
const AppointmentCardSkeleton = () => (
  <div className="bg-white h-[205px] md:h-[201px] rounded-[16px] p-4 md:p-6 shadow-[0px_0px_16px_0px_#00000014] animate-pulse">
    <div className="flex flex-col md:flex-row-reverse items-start justify-between gap-4">
      {/* Date and Time skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="w-[1px] h-[16px] bg-gray-200"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="flex items-start gap-4">
        {/* Doctor Image skeleton */}
        <div className="w-[56px] h-[56px] rounded-full bg-gray-200 flex-shrink-0"></div>
        {/* Appointment Info skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-5 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
    {/* Divider skeleton */}
    <div className="w-full h-[1px] bg-gray-200 my-4 md:my-6"></div>
    {/* Action Buttons skeleton */}
    <div className="flex items-center justify-center md:justify-end gap-2">
      <div className="h-[40px] bg-gray-200 rounded w-[109px]"></div>
      <div className="h-[40px] bg-gray-200 rounded w-[130px]"></div>
    </div>
  </div>
);

export default AppointmentCardSkeleton;

