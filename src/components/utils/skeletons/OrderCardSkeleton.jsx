// Loading skeleton component for OrderCard
const OrderCardSkeleton = () => (
  <div className="bg-white main-shadow rounded-[16px] mb-3 overflow-hidden p-5 md:p-6 animate-pulse">
    {/* Order Header skeleton */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-[10px]">
        {/* Product Image skeleton */}
        <div className="w-10 h-10 bg-gray-200 rounded-[8px]"></div>
        <div>
          {/* Product Name skeleton */}
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          {/* Product Subtitle skeleton */}
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      {/* Chevron skeleton */}
      <div className="w-5 h-5 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export default OrderCardSkeleton;

