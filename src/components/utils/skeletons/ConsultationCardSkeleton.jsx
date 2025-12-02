// Loading skeleton component for ConsultationCard (pending state)
const ConsultationCardSkeleton = () => (
  <div className="bg-white w-full shadow-[0px_0px_16px_0px_#00000014] rounded-[16px] p-5 md:p-6 animate-pulse">
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      {/* Title skeleton */}
      <div className="h-5 bg-gray-200 rounded w-3/4 md:w-1/2 mb-3"></div>
      {/* Date skeleton */}
      <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
    </div>
    {/* Description skeleton */}
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
    {/* Progress bar and button skeleton */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Progress bar skeleton */}
      <div className="flex-1 max-w-[320px]">
        <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="w-full h-[4px] bg-gray-200 rounded-full"></div>
      </div>
      {/* Button skeleton */}
      <div className="md:w-auto w-full md:w-[171px]">
        <div className="h-[40px] bg-gray-200 rounded-full"></div>
      </div>
    </div>
  </div>
);

// Loading skeleton component for ConsultationCard (completed state - horizontal scroll)
const ConsultationCardCompletedSkeleton = () => (
  <div className="bg-white w-[272px] md:w-[324px] shadow-[0px_0px_16px_0px_#00000014] rounded-[16px] p-5 md:p-6 animate-pulse">
    {/* Category skeleton */}
    <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
    {/* Title skeleton */}
    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
    {/* Completed Date skeleton */}
    <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
    {/* Description skeleton */}
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
    {/* Divider skeleton */}
    <div className="border-t border-gray-200 my-4"></div>
    {/* Status Badge skeleton */}
    <div className="h-8 bg-gray-200 rounded-full w-24"></div>
  </div>
);

export default ConsultationCardSkeleton;
export { ConsultationCardCompletedSkeleton };
