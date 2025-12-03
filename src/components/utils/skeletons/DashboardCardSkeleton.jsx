// Loading skeleton component for DashboardCard
const DashboardCardSkeleton = () => (
  <div className="bg-white rounded-[16px] main-shadow w-[140px] h-[166px] md:w-[256px] md:h-[169px] p-4 md:p-6 animate-pulse">
    <div className="mb-6 h-[82px]">
      {/* Count skeleton */}
      <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
      {/* Title skeleton */}
      <div className="h-5 bg-gray-200 rounded w-20"></div>
    </div>
    {/* Link skeleton */}
    <div className="h-4 bg-gray-200 rounded w-[60px] md:w-24"></div>
  </div>
);

export default DashboardCardSkeleton;

