// Loading skeleton component for SubscriptionCard
const SubscriptionCardSkeleton = () => (
  <div className="bg-white w-[272px] md:w-[324px] h-[436px] md:h-[436px] shadow-[0px_0px_16px_0px_#00000014] rounded-[16px] p-6 mb-3 animate-pulse">
    {/* Status Badge skeleton */}
    <div className="w-full mb-4">
      <div className="h-8 bg-gray-200 rounded-full"></div>
    </div>
    {/* Product Info skeleton */}
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      {/* Product Image skeleton */}
      <div className="w-10 h-10 bg-gray-200 rounded-[8px] flex-shrink-0"></div>
    </div>
    {/* Dosage Info skeleton */}
    <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
    {/* Next Refill skeleton */}
    <div className="mb-4">
      <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </div>
    {/* Divider skeleton */}
    <div className="border-t border-gray-200 mt-[33px] mb-4"></div>
    {/* Action Buttons skeleton */}
    <div className="flex flex-col gap-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-[40px] bg-gray-200 rounded-full"></div>
      ))}
    </div>
  </div>
);

export default SubscriptionCardSkeleton;

